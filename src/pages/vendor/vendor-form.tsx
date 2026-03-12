import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Save, Send } from "lucide-react";
import { getSessionData } from "@/lib/session-utils";
import { updateFormData as updateFormDataAPI } from "@/services/form-data";
import { FileUploadProvider } from "@/contexts/FileUploadContext";

// Import vendor components
import {
  TypeOfVendorSection,
  VendorDetailsSection,
  KeyDetailsSection,
  AddressDetailsSection,
  BankDetailsSection,
  InternalDetailsSection,
} from "@/components/vendor";
import SystemFieldsSection from "@/components/vendor/SystemFieldsSection";

// Import types
import type { FormSection } from "@/components/vendor";

// Import utilities
import { validateSection } from "@/components/vendor/validation";

// Import custom hooks and services
import { useVendorFormState } from "@/hooks/useVendorFormState";
import { useVendorDataLoader } from "@/hooks/useVendorDataLoader";
import { useVendorOrganizationSync } from "@/hooks/useVendorOrganizationSync";
import { useVendorFileUpload } from "@/hooks/useVendorFileUpload";
import { useDeletedFilesTracker } from "@/hooks/useDeletedFilesTracker";
import { mapFormDataToAPI } from "@/services/vendor-form-mapper";
import { FORM_SECTIONS, SESSION_KEYS } from "@/config/vendor-form-config";
import { deleteFileApi } from "@/services/Upload-download";
import { convertUTCtoIST } from "@/lib/date-converter";

// Utility function to get current timestamp in IST (UTC+5:30)
const getISTTimestamp = (): string => {
  const now = new Date();
  // Add 5 hours and 30 minutes (330 minutes) to UTC time
  const istTime = new Date(now.getTime() + 330 * 60 * 1000);
  // Format as ISO string and replace Z with +05:30 to indicate IST
  return istTime.toISOString().replace("Z", "+05:30");
};

// Utility function to auto-focus on first error field
const focusOnFirstError = (errors: Record<string, string>) => {
  setTimeout(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      // Try multiple selectors to find the input field
      const selectors = [
        `[name="${firstErrorField}"]`,
        `[id="${firstErrorField}"]`,
        `input[name="${firstErrorField}"]`,
        `textarea[name="${firstErrorField}"]`,
        `select[name="${firstErrorField}"]`,
      ];

      let errorElement: HTMLElement | null = null;
      for (const selector of selectors) {
        errorElement = document.querySelector(selector) as HTMLElement;
        if (errorElement) break;
      }

      if (errorElement) {
        // Scroll to element with smooth behavior
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Focus the element
        errorElement.focus();

        // For input elements, select the text if any
        if (
          errorElement instanceof HTMLInputElement ||
          errorElement instanceof HTMLTextAreaElement
        ) {
          errorElement.select();
        }
      }
    }
  }, 150); // Slightly longer delay to ensure DOM is updated
};

const VendorFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingAttachments, setExistingAttachments] = useState<
    Record<string, any> | undefined
  >(undefined);

  // Get form context from URL parameters
  const formName = searchParams.get("formName") || "Vendor Onboarding";
  const orgName = searchParams.get("orgName") || "";
  const editMode = searchParams.get("editMode") === "true";
  const viewMode = searchParams.get("mode") === "view";
  const transId = searchParams.get("transId") || "";
  const hasStep1Data = searchParams.get("step1Data") === "true";

  // 🔥 NEW: Debug logging for form context
  // console.log("🔍 VendorFormPage: Form context:", {
  //   formName,
  //   orgName,
  //   editMode,
  //   viewMode,
  //   transId,
  //   hasStep1Data,
  //   searchParams: {
  //     formName: searchParams.get("formName"),
  //     orgName: searchParams.get("orgName"),
  //     editMode: searchParams.get("editMode"),
  //     mode: searchParams.get("mode"),
  //     transId: searchParams.get("transId"),
  //     step1Data: searchParams.get("step1Data"),
  //   },
  // });

  // Determine if Step 1 fields should be read-only
  const isStep1FieldsReadOnly = Boolean(hasStep1Data || (editMode && transId));

  // Custom hooks for data management
  const { lovData, initialFormData, reloadDataForOrg } = useVendorDataLoader({
    orgName,
    hasStep1Data,
    editMode,
    viewMode,
    transId,
    formName: formName,
  });

  const {
    formData,
    setFormData,
    errors,
    handleInputChange,
    updateFormData,
    updateErrors,
    validateField,
  } = useVendorFormState({
    initialData: initialFormData,
    lovData,
  });

  const {
    uploadFiles,
    refreshFileURLs,
    getOptimizedAttachmentFieldNames,
    markFileAsUploaded,
    markFileAsDeleted,
    clearFileActionTracking,
  } = useVendorFileUpload();

  // 🔥 NEW: Deleted files tracker
  const { addDeletedFile, clearDeletedFiles, getDeletedFiles } =
    useDeletedFilesTracker();

  // Function to update existingAttachments when files are deleted
  const handleFileDeleted = (fieldName: string) => {
    console.log(`🗑️ File ${fieldName} deleted, updating existingAttachments`);
    setExistingAttachments((prev) => {
      if (!prev) return prev;

      const updated = { ...prev };
      // Map form field names to attachment field names
      const fieldMapping: Record<string, string> = {
        taxNumber3GSTINFile: "gstin_attachment",
        panNumberFile: "pan_attachment",
        creditInformationNumberMSMEFile: "msme_attachment",
        cinNumberFile: "cin_attachment",
        panAadharLinkedStatusFile: "pan_aadhar_linkage_attachment",
        bankKeyIFSCCodeFile: "bank_details_attachment",
      };

      const attachmentField = fieldMapping[fieldName];
      if (attachmentField) {
        updated[attachmentField] = null;
        console.log(
          `🗑️ Updated existingAttachments.${attachmentField} to null`
        );
      }

      return updated;
    });
  };

  // 🔥 NEW: Function to delete files from storage after successful save
  const deleteFilesFromStorage = async (
    deletedFiles: Array<{
      fieldKey: string;
      fileName: string;
      fileType: string;
      fileUrl: string;
    }>
  ) => {
    console.log("🗑️ Starting to delete files from storage:", deletedFiles);

    const sessionData = getSessionData();
    const deleteContext = {
      orgName: orgName || sessionData.orgName || "Rustom Jee",
      formName: formName || "Vendor Onboarding",
      transactionId:
        transId || sessionStorage.getItem(SESSION_KEYS.TRANSACTION_ID) || "",
    };

    if (!deleteContext.transactionId) {
      console.error("❌ No transaction ID available for file deletion");
      toast.error("Cannot delete files: Missing transaction context");
      return false;
    }

    let allDeleted = true;

    for (const deletedFile of deletedFiles) {
      try {
        console.log(`🗑️ Deleting file from storage: ${deletedFile.fileName}`);

        const deletePayload = {
          org_name: deleteContext.orgName,
          form_name: deleteContext.formName,
          file_name: deletedFile.fileName,
          file_type: deletedFile.fileType,
          file_url: deletedFile.fileUrl,
          transaction_id: deleteContext.transactionId,
        };

        const response = await deleteFileApi(deletePayload);

        if (response.status_code === 200 || response.status_code === "200") {
          console.log(
            `✅ File "${deletedFile.fileName}" deleted successfully from storage`
          );
        } else {
          console.warn(
            `⚠️ Failed to delete file "${deletedFile.fileName}" from storage:`,
            response
          );
          allDeleted = false;
        }
      } catch (error) {
        console.error(
          `❌ Error deleting file "${deletedFile.fileName}" from storage:`,
          error
        );
        allDeleted = false;
      }
    }

    if (allDeleted) {
      console.log("✅ All files deleted successfully from storage");
      // toast.success("File are deleted");
    } else {
      console.warn("⚠️ Some files could not be deleted from storage");
      toast.warning("Some files could not be deleted from storage");
    }

    return allDeleted;
  };

  // Handle organization changes
  useVendorOrganizationSync({
    editMode,
    viewMode,
    transId,
    reloadDataForOrg,
    onDataReloaded: updateFormData,
  });
  console.log("🔍 formData levy", formData);
  const istTimestamp = convertUTCtoIST(new Date());
  // Store existing attachments when initial form data is loaded
  React.useEffect(() => {
    if (initialFormData && (editMode || viewMode)) {
      // Extract existing attachments from the initial form data
      const attachments = {
        gstin_attachment:
          initialFormData.taxNumber3GSTINFile &&
            "file_url" in initialFormData.taxNumber3GSTINFile
            ? {
              file_url: initialFormData.taxNumber3GSTINFile.file_url || "",
              file_name: initialFormData.taxNumber3GSTINFile.file_name || "",
              file_type: initialFormData.taxNumber3GSTINFile.file_type || "",
            }
            : null,
        pan_attachment:
          initialFormData.panNumberFile &&
            "file_url" in initialFormData.panNumberFile
            ? {
              file_url: initialFormData.panNumberFile.file_url || "",
              file_name: initialFormData.panNumberFile.file_name || "",
              file_type: initialFormData.panNumberFile.file_type || "",
            }
            : null,
        cin_attachment:
          initialFormData.cinNumberFile &&
            "file_url" in initialFormData.cinNumberFile
            ? {
              file_url: initialFormData.cinNumberFile.file_url || "",
              file_name: initialFormData.cinNumberFile.file_name || "",
              file_type: initialFormData.cinNumberFile.file_type || "",
            }
            : null,
        msme_attachment:
          initialFormData.creditInformationNumberMSMEFile &&
            "file_url" in initialFormData.creditInformationNumberMSMEFile
            ? {
              file_url:
                initialFormData.creditInformationNumberMSMEFile.file_url ||
                "",
              file_name:
                initialFormData.creditInformationNumberMSMEFile.file_name ||
                "",
              file_type:
                initialFormData.creditInformationNumberMSMEFile.file_type ||
                "",
            }
            : null,
        pan_aadhar_linkage_attachment:
          initialFormData.panAadharLinkedStatusFile &&
            "file_url" in initialFormData.panAadharLinkedStatusFile
            ? {
              file_url:
                initialFormData.panAadharLinkedStatusFile.file_url || "",
              file_name:
                initialFormData.panAadharLinkedStatusFile.file_name || "",
              file_type:
                initialFormData.panAadharLinkedStatusFile.file_type || "",
            }
            : null,
        bank_details_attachment:
          initialFormData.bankKeyIFSCCodeFile &&
            "file_url" in initialFormData.bankKeyIFSCCodeFile
            ? {
              file_url: initialFormData.bankKeyIFSCCodeFile.file_url || "",
              file_name: initialFormData.bankKeyIFSCCodeFile.file_name || "",
              file_type: initialFormData.bankKeyIFSCCodeFile.file_type || "",
            }
            : null,
        other_attachments: [],
      };

      setExistingAttachments(attachments);
      console.log("📎 Stored existing attachments:", attachments);
    }
  }, [initialFormData, editMode, viewMode]);

  const handleSaveSection = async (section: FormSection) => {
    const { isValid, errors: sectionErrors } = validateSection(
      section,
      formData,
      lovData
    );

    if (!isValid) {
      updateErrors({ ...errors, ...sectionErrors });
      toast.error(`Please fix the errors in ${section} section before saving`);

      // Auto-focus on the first error field in this section
      focusOnFirstError(sectionErrors);
      return;
    }

    setIsSaving(true);
    try {
      // Section save is a placeholder for future implementation
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(
        `${section.charAt(0).toUpperCase() + section.slice(1)
        } section saved successfully!`
      );
    } catch {
      toast.error(`Failed to save ${section} section. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate ALL required fields before submitting
    let allValid = true;
    let allErrors = {};

    for (const section of FORM_SECTIONS) {
      const { isValid, errors: sectionErrors } = validateSection(
        section,
        formData,
        lovData
      );
      if (!isValid) {
        allValid = false;
        allErrors = { ...allErrors, ...sectionErrors };
      }
    }

    if (!allValid) {
      updateErrors(allErrors);
      toast.error("Please fill all the required fields before submitting");

      // Auto-focus on the first error field
      focusOnFirstError(allErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const sessionData = getSessionData();

      // Get transaction ID from URL params or session storage
      const currentTransId =
        transId || sessionStorage.getItem(SESSION_KEYS.TRANSACTION_ID);

      if (!currentTransId) {
        toast.error("Transaction ID not found. Please start over.");
        // navigate(-1);
        return;
      }

      // Upload files and get URLs (only new files, existing ones use permanent URLs)
      const { changedFields } = await uploadFiles(
        formData,
        orgName || sessionData.orgName,
        formName
      );

      console.log("📝 Changed fields for submit:", changedFields);

      // Map form data to API format (simplified - data goes in exact format now)
      const apiFormData = mapFormDataToAPI(
        formData,
        existingAttachments,
        getDeletedFiles()
      );

      // Add form_id and submission metadata
      const formId = sessionStorage.getItem(SESSION_KEYS.FORM_ID) || "";
      const completeFormData = {
        form_id: formId,
        form_submitted_by: sessionData.userId,
        form_submitted_on: istTimestamp,
        ...apiFormData,
        attachments: {
          // For submit operation, use permanent URLs from form data (not temporary URLs from uploadedFiles)
          gstin_attachment: apiFormData.attachments.gstin_attachment,
          pan_attachment: apiFormData.attachments.pan_attachment,
          cin_attachment: apiFormData.attachments.cin_attachment,
          msme_attachment: apiFormData.attachments.msme_attachment,
          pan_aadhar_linkage_attachment:
            apiFormData.attachments.pan_aadhar_linkage_attachment,
          bank_details_attachment:
            apiFormData.attachments.bank_details_attachment,
          other_attachments: apiFormData.attachments.other_attachments,
        },
      };
      console.log("🔍 completeFormData  ", completeFormData);

      // Update form data with "Submitted" status
      const updatePayload = {
        search_fields: {
          form_name: formName,
          org_name: orgName || sessionData.orgName,
          transaction_id: currentTransId,
        },
        update_fields: {
          form_status: "Submitted",
          updated_by: sessionData.userId,
          form_data: completeFormData,
          updated_attachment_fields:
            getOptimizedAttachmentFieldNames(changedFields),
        },
        trans_history_flag: false,
        trans_data_flag: false,
        email_type: "Confirmation Mail",
        email_attachments_flag: true,
      };

      const { error } = await updateFormDataAPI(updatePayload);

      if (error) {
        throw new Error(error);
      }

      toast.success("Vendor data submitted successfully!");

      // Clear file action tracking since files are now submitted
      clearFileActionTracking();

      // 🔥 NEW: Delete files from storage after successful submit
      const deletedFiles = getDeletedFiles();
      if (deletedFiles.length > 0) {
        console.log(
          "🗑️ Deleting files from storage after successful submit:",
          deletedFiles
        );
        await deleteFilesFromStorage(deletedFiles);
        clearDeletedFiles(); // Clear the deleted files list
      }

      // Clear session storage after successful submission
      sessionStorage.removeItem(SESSION_KEYS.STEP1_DATA);
      sessionStorage.removeItem(SESSION_KEYS.TRANSACTION_ID);
      sessionStorage.removeItem(SESSION_KEYS.FORM_ID);

      // Clear Step 1 data from session storage to prevent conflicts on reload
      sessionStorage.removeItem("Step1FormData");
      sessionStorage.removeItem("VendorTransactionId");

      // Redirect to form-data page with formName and orgName from URL params
      navigate(
        `/form-data?formName=${encodeURIComponent(
          formName
        )}&orgName=${encodeURIComponent(orgName)}`
      );
    } catch {
      toast.error("Failed to submit vendor data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const sessionData = getSessionData();

      // Get transaction ID from URL params or session storage
      const currentTransId =
        transId || sessionStorage.getItem(SESSION_KEYS.TRANSACTION_ID);

      if (!currentTransId) {
        toast.error("Transaction ID not found. Please start over.");
        navigate(-1);
        return;
      }

      // Upload files and get URLs (only new files, existing ones use permanent URLs)
      const { changedFields } = await uploadFiles(
        formData,
        orgName || sessionData.orgName,
        formName
      );

      // Map form data to API format (including deleted files)
      const apiFormData = mapFormDataToAPI(
        formData,
        existingAttachments,
        getDeletedFiles()
      );

      // Add form_id and submission metadata
      const formId = sessionStorage.getItem(SESSION_KEYS.FORM_ID) || "";
      const completeFormData = {
        form_id: formId,
        form_submitted_by: sessionData.userId,
        form_submitted_on: istTimestamp,
        ...apiFormData,
        attachments: {
          // For save operation, use permanent URLs from form data (not temporary URLs from uploadedFiles)
          gstin_attachment: apiFormData.attachments.gstin_attachment,
          pan_attachment: apiFormData.attachments.pan_attachment,
          cin_attachment: apiFormData.attachments.cin_attachment,
          msme_attachment: apiFormData.attachments.msme_attachment,
          pan_aadhar_linkage_attachment:
            apiFormData.attachments.pan_aadhar_linkage_attachment,
          bank_details_attachment:
            apiFormData.attachments.bank_details_attachment,
          other_attachments: apiFormData.attachments.other_attachments,
        },
      };

      // Update form data with "Draft" status
      const updatePayload = {
        search_fields: {
          form_name: formName,
          org_name: orgName || sessionData.orgName,
          transaction_id: currentTransId,
        },
        update_fields: {
          form_status: "Draft",
          updated_by: sessionData.userId,
          form_data: completeFormData,
          updated_attachment_fields:
            getOptimizedAttachmentFieldNames(changedFields),
        },
        trans_history_flag: false,
        trans_data_flag: false,
      };

      const { error } = await updateFormDataAPI(updatePayload);

      if (error) {
        throw new Error(error);
      }

      // Refresh file URLs to get permanent URLs from server
      console.log("🔄 Save successful, refreshing file URLs...");
      const updatedFormData = await refreshFileURLs(
        formData,
        orgName || sessionData.orgName,
        currentTransId,
        formName
      );

      // Update form data with permanent URLs
      updateFormData(updatedFormData);
      console.log("✅ Form data updated with permanent file URLs");

      // Clear file action tracking since files are now saved with permanent URLs
      clearFileActionTracking();

      // 🔥 NEW: Delete files from storage after successful save
      const deletedFiles = getDeletedFiles();
      if (deletedFiles.length > 0) {
        console.log(
          "🗑️ Deleting files from storage after successful save:",
          deletedFiles
        );
        await deleteFilesFromStorage(deletedFiles);
        clearDeletedFiles(); // Clear the deleted files list
      }

      // Clear Step 1 data from session storage after successful save to prevent conflicts on reload
      sessionStorage.removeItem("Step1FormData");
      sessionStorage.removeItem("VendorTransactionId");

      toast.success("Vendor data saved successfully!");
    } catch {
      toast.error("Failed to save vendor data. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // Function to check if Key Details section has "invalid" validation errors
  const hasKeyDetailsInvalidErrors = (): boolean => {
    const { errors: keyErrors } = validateSection("key", formData, lovData);

    // Check if MSME or CIN number fields have "invalid" in their error messages
    const msmeError = keyErrors.creditInformationNumberMSME;
    const cinError = keyErrors.cinNumber;

    const hasInvalidError =
      Boolean(msmeError && msmeError.toLowerCase().includes("invalid")) ||
      Boolean(cinError && cinError.toLowerCase().includes("invalid"));

    if (hasInvalidError) {
      console.log("🚫 Key Details invalid format errors found:");
      if (msmeError && msmeError.toLowerCase().includes("invalid")) {
        console.log("❌ MSME Error:", msmeError);
      }
      if (cinError && cinError.toLowerCase().includes("invalid")) {
        console.log("❌ CIN Error:", cinError);
      }
    }

    return hasInvalidError;
  };

  return (
    <div className="h-screen bg-sidebar rounded-lg border  overflow-hidden shadow-sm flex flex-col">
      {/* Header */}
      <div className="bg-primary  px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div onClick={handleCancel} className="hover:cursor-pointer">
              <ChevronLeft className="h-6 w-6 text-muted" />
            </div>
            <div>
              <h1 className="text-lg text-muted font-semibold">
                VENDOR ONBOARDING FORM
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            {viewMode ? (
              <div className="text-white text-sm font-medium">
                View Mode - Read Only
              </div>
            ) : (
              <>
                <Button
                  onClick={handleSave}
                  disabled={
                    isSaving || isSubmitting || hasKeyDetailsInvalidErrors()
                  }
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isSaving}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Form Content - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Type of Vendor Section */}
            <TypeOfVendorSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode || isStep1FieldsReadOnly}
              editMode={editMode}
            />

            {/* Vendor Details Section */}
            <VendorDetailsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
              hasStep1Data={isStep1FieldsReadOnly}
            />

            {/* Key Details Section */}
            <KeyDetailsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
              hasStep1Data={isStep1FieldsReadOnly}
              validateField={validateField}
              updateErrors={updateErrors}
              markFileAsUploaded={markFileAsUploaded}
              markFileAsDeleted={(fieldName) => {
                markFileAsDeleted(fieldName);
                handleFileDeleted(fieldName);
              }}
              formName={formName}
              // 🔥 NEW: Pass refreshFileURLs and related props for URL refresh before delete
              refreshFileURLs={refreshFileURLs}
              currentFormData={formData}
              orgName={orgName}
              transactionId={transId}
              // 🔥 NEW: Pass deleted files tracking props
              addDeletedFile={addDeletedFile}
              useTrackingMode={true}
            />

            {/* Address Details Section */}
            <AddressDetailsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
              validateField={validateField}
            />

            {/* Bank Details Section */}
            <BankDetailsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
              updateErrors={updateErrors}
              markFileAsUploaded={markFileAsUploaded}
              markFileAsDeleted={(fieldName) => {
                markFileAsDeleted(fieldName);
                handleFileDeleted(fieldName);
              }}
              formName={formName}
              // 🔥 NEW: Pass refreshFileURLs and related props for URL refresh before delete
              refreshFileURLs={refreshFileURLs}
              currentFormData={formData}
              orgName={orgName}
              transactionId={transId}
              // 🔥 NEW: Pass deleted files tracking props
              addDeletedFile={addDeletedFile}
              useTrackingMode={true}
              validateField={validateField}
            />

            {/* Internal Details Section */}
            <InternalDetailsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
            />
            <SystemFieldsSection
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              lovData={lovData}
              handleInputChange={handleInputChange}
              handleSaveSection={handleSaveSection}
              isSaving={isSaving}
              isReadOnly={viewMode}
              editMode={editMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const VendorFormPageWithProvider = () => {
  return (
    <FileUploadProvider>
      <VendorFormPage />
    </FileUploadProvider>
  );
};

export default VendorFormPageWithProvider;
