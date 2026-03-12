import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFormData, updateFormData } from "@/services/form-data";
import { getSessionData } from "@/lib/session-utils";
import { useFileUploadContext } from "@/contexts/FileUploadContext";
import { toast } from "sonner";

interface FormTemplate {
  sections?: Array<{
    fields: Array<{
      type: string;
      name: string;
    }>;
  }>;
  fields?: Array<{
    type: string;
    name: string;
  }>;
}

export const useFormSubmission = () => {
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { getSuccessfullyUploadedFiles, uploading: fileUploading } =
    useFileUploadContext();
  console.log("File uploading:", fileUploading);

  const extractFileFields = (template: FormTemplate): string[] => {
    const fileFields: string[] = [];

    if ("sections" in template && template.sections) {
      template.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type === "file") {
            fileFields.push(field.name);
          }
        });
      });
    } else if ("fields" in template && template.fields) {
      template.fields.forEach((field) => {
        if (field.type === "file") {
          fileFields.push(field.name);
        }
      });
    }

    return fileFields;
  };

  const getOriginalFormData = () => {
    try {
      const storedEditData = sessionStorage.getItem("EditFormData");
      if (storedEditData) {
        const parsedData = JSON.parse(storedEditData);
        return parsedData.form_data || {};
      }
    } catch (error) {
      console.error("Error getting original form data:", error);
    }
    return {};
  };

  const findUpdatedFileFields = (
    fileFields: string[],
    formDataWithFiles: Record<string, unknown>
  ) => {
    const originalFormData = getOriginalFormData();
    const updatedFileFields: string[] = [];

    fileFields.forEach((fieldName) => {
      const originalValue = originalFormData[fieldName];
      const newValue = formDataWithFiles[fieldName];

      if (originalValue !== newValue) {
        if (
          typeof originalValue === "object" &&
          originalValue !== null &&
          typeof newValue === "object" &&
          newValue !== null
        ) {
          const originalFile = originalValue as any;
          const newFile = newValue as any;
          if (
            originalFile.file_name !== newFile.file_name ||
            originalFile.file_type !== newFile.file_type
          ) {
            updatedFileFields.push(fieldName);
          }
        } else {
          if (originalValue !== newValue) {
            updatedFileFields.push(fieldName);
          }
        }
      }
    });

    return updatedFileFields;
  };

  const handleFormSubmit = async (
    formData: Record<string, unknown>,
    formDetails: any,
    editMode: boolean,
    transId: string | null,
    formName: string | null,
    orgName: string | null
  ) => {
    setSubmitting(true);
    try {
      let userId: string;
      let orgNameFromSession: string;

      try {
        const sessionData = getSessionData();
        userId = sessionData.userId;
        orgNameFromSession = sessionData.orgName;
      } catch (error) {
        console.error("Session error:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Session error. Please login again."
        );
        // Don't return here, try to get data from URL parameters as fallback
        if (!orgName || !formName) {
          toast.error("Missing form context. Please try again.");
          return;
        }
        // For edit mode, we need userId, so we can't proceed without session
        if (editMode) {
          toast.error("Session expired. Please login again.");
          return;
        }
        // For create mode, we can try to get userId from session storage directly
        try {
          const userDetailStr = sessionStorage.getItem("userDetail");
          if (userDetailStr) {
            const userDetail = JSON.parse(userDetailStr);
            userId = userDetail.user_id;
            orgNameFromSession = orgName; // Use orgName from URL parameters
          } else {
            toast.error("User session not found. Please login again.");
            return;
          }
        } catch (fallbackError) {
          console.error("Fallback session error:", fallbackError);
          toast.error("User session not found. Please login again.");
          return;
        }
      }

      if (!formDetails) {
        toast.error("Form details not found");
        return;
      }

      const fileFields = extractFileFields(formDetails.form_template);
      const processedFormData: Record<string, unknown> = {};

      // Separate file fields from regular form data
      Object.entries(formData).forEach(([key, value]) => {
        if (!fileFields.includes(key) || !(value instanceof File)) {
          processedFormData[key] = value;
        }
      });

      // Get successfully uploaded files
      const uploadedFiles = getSuccessfullyUploadedFiles();
      console.log("Successfully uploaded files:", uploadedFiles);

      // Prepare form_data with uploaded file information
      const formDataWithFiles = { ...processedFormData };

      // Add uploaded file information to form_data for each file field
      Object.entries(uploadedFiles).forEach(([fieldName, uploadedFile]) => {
        if (uploadedFile && uploadedFile.fileUrl) {
          console.log(
            `Adding uploaded file ${fieldName} with URL: ${uploadedFile.fileUrl}`
          );
          formDataWithFiles[fieldName] = {
            file_name: uploadedFile.fileName,
            file_type: uploadedFile.fileType,
            file_url: uploadedFile.fileUrl,
          };
        } else {
          console.warn(`Uploaded file ${fieldName} missing URL:`, uploadedFile);
        }
      });

      // Preserve existing files that weren't changed (for edit mode)
      fileFields.forEach((fieldName) => {
        if (
          !uploadedFiles[fieldName] &&
          formData[fieldName] &&
          typeof formData[fieldName] === "object" &&
          "file_name" in (formData[fieldName] as any) &&
          "file_url" in (formData[fieldName] as any)
        ) {
          console.log(
            `Preserving existing file ${fieldName}:`,
            formData[fieldName]
          );
          formDataWithFiles[fieldName] = formData[fieldName];
        }
      });

      // Check if there are file fields that should have files but don't have uploaded files
      const missingFileFields = fileFields.filter((fieldName) => {
        const hasUploadedFile = uploadedFiles[fieldName]?.isUploaded;
        const hasExistingFile =
          formData[fieldName] &&
          typeof formData[fieldName] === "object" &&
          "file_name" in (formData[fieldName] as any) &&
          "file_url" in (formData[fieldName] as any);

        // If there's no successful upload and no existing file, it's missing
        return !hasUploadedFile && !hasExistingFile;
      });

      if (missingFileFields.length > 0) {
        toast.error(`Please upload files for: ${missingFileFields.join(", ")}`);
        return;
      }

      console.log("Final form data with files:", formDataWithFiles);

      let response;

      if (editMode && transId) {
        const updatedFileFields = findUpdatedFileFields(
          fileFields,
          formDataWithFiles
        );

        // For edit mode, use the orgName from URL parameters or session
        const editOrgName = orgName || orgNameFromSession;
        const editFormName = formName || "";

        if (!editOrgName || !editFormName) {
          toast.error("Missing form context for edit. Please try again.");
          return;
        }

        const updatePayload = {
          search_fields: {
            org_name: editOrgName,
            form_name: editFormName,
            transaction_id: transId,
          },
          update_fields: {
            form_status: "Draft",
            updated_by: userId,
            form_data: formDataWithFiles,
            updated_attachment_fields: updatedFileFields,
          },
          trans_history_flag: false,
          trans_data_flag: false,
        };

        console.log("Update payload:", updatePayload);
        response = await updateFormData(updatePayload);
      } else {
        const createPayload = {
          form_status: "Submitted",
          created_by: userId,
          form_data: formDataWithFiles,
          org_name: orgNameFromSession,
          form_name: formName || "",
          attachment_fields: fileFields,
        };

        response = await createFormData(createPayload);
      }

      if (response.error) {
        toast.error(response.error);
      } else {
        if (editMode) {
          toast.success("Form updated successfully!");
          sessionStorage.removeItem("EditFormData");
        } else {
          toast.success("Form submitted successfully!");
        }

        // Navigate back to form data page after successful submission
        setTimeout(() => {
          navigate("/form-data");
        }, 1500);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to submit form");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    // This will be called from the form component to reset all form data
    // The actual reset logic will be handled by the form component
    console.log("Form reset requested");
  };

  return {
    submitting: submitting || fileUploading,
    handleFormSubmit,
    resetForm,
  };
};
