/**
 * Custom hook for handling vendor form file uploads
 * Extracts file upload logic for better reusability
 */

import React from "react";
import { uploadFileApi } from "@/services/Upload-download";
import type { VendorFormData } from "@/components/vendor";

/**
 * Helper function to convert file to base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Helper function to check if a file is already uploaded
 */
const isFileAlreadyUploaded = (
  file: any
): file is { file_name: string; file_type: string; file_url: string } => {
  return (
    file &&
    typeof file === "object" &&
    "file_url" in file &&
    file.file_url &&
    file.file_url.trim() !== ""
  );
};

/**
 * Upload all vendor form files and return URLs
 * Only uploads files that haven't been uploaded yet to prevent duplicate API calls
 */
export const useVendorFileUpload = () => {
  // Track file upload/deletion actions in current session
  // Use useRef to persist the Map across renders
  const fileActionTrackerRef = React.useRef(
    new Map<string, "uploaded" | "deleted">()
  );
  const fileActionTracker = fileActionTrackerRef.current;

  /**
   * Mark a file field as uploaded (called when file is uploaded through UI)
   */
  const markFileAsUploaded = (fieldName: string) => {
    console.log(`🎯 markFileAsUploaded called with fieldName: ${fieldName}`);
    fileActionTracker.set(fieldName, "uploaded");
    console.log(`📝 Marked ${fieldName} as uploaded in current session`);
    console.log(
      `🔍 Tracker now contains:`,
      Array.from(fileActionTracker.entries())
    );
  };

  /**
   * Mark a file field as deleted (called when file is deleted through UI)
   */
  const markFileAsDeleted = (fieldName: string) => {
    fileActionTracker.set(fieldName, "deleted");
    console.log(`📝 Marked ${fieldName} as deleted in current session`);
  };

  /**
   * Clear all tracking (called after save/submit)
   */
  const clearFileActionTracking = () => {
    fileActionTracker.clear();
    console.log("🧹 Cleared file action tracking");
  };

  /**
   * Get changed fields based on upload/deletion actions
   */
  const getChangedFieldsFromActions = (): string[] => {
    const changedFields: string[] = [];

    console.log(
      "🔍 Current file action tracker contents:",
      Array.from(fileActionTracker.entries())
    );

    fileActionTracker.forEach((action, fieldName) => {
      if (action === "uploaded") {
        changedFields.push(fieldName);
        console.log(
          `📝 ${fieldName} was uploaded, including in changed fields`
        );
      }
      // Note: We don't include deleted files in changedFields
      // The backend will handle deletion based on the absence of the field
    });

    console.log("📝 Final changed fields from actions:", changedFields);
    return changedFields;
  };

  const uploadFiles = async (
    formData: VendorFormData,
    orgName: string,
    formName: string = "Vendor Onboarding"
  ): Promise<{
    uploadedFiles: Record<string, { name: string; type: string; url: string }>;
    changedFields: string[];
  }> => {
    const uploadedFiles: Record<
      string,
      { name: string; type: string; url: string }
    > = {};
    const changedFields: string[] = [];

    console.log("🔄 Starting file upload process...");
    console.log("📋 Form data files:", {
      taxNumber3GSTINFile: formData.taxNumber3GSTINFile,
      panNumberFile: formData.panNumberFile,
      creditInformationNumberMSMEFile: formData.creditInformationNumberMSMEFile,
      cinNumberFile: formData.cinNumberFile,
      panAadharLinkedStatusFile: formData.panAadharLinkedStatusFile,
      bankKeyIFSCCodeFile: formData.bankKeyIFSCCodeFile,
    });

    // Handle GSTIN file
    if (formData.taxNumber3GSTINFile) {
      if (isFileAlreadyUploaded(formData.taxNumber3GSTINFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ GSTIN file already uploaded, using existing URL:",
          formData.taxNumber3GSTINFile.file_url
        );
        uploadedFiles.taxNumber3GSTINFile = {
          name: formData.taxNumber3GSTINFile.file_name,
          type: formData.taxNumber3GSTINFile.file_type,
          url: formData.taxNumber3GSTINFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log("♻️ GSTIN file already uploaded, not tracking as changed");
      } else if (formData.taxNumber3GSTINFile instanceof File) {
        // New file, upload it
        console.log(
          "📤 Uploading new GSTIN file:",
          formData.taxNumber3GSTINFile.name
        );
        const base64 = await fileToBase64(formData.taxNumber3GSTINFile);
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.taxNumber3GSTINFile.name,
          file_type: formData.taxNumber3GSTINFile.type,
          file_base64: base64,
        });
        console.log("📤 GSTIN upload response:", uploadResponse);
        if (uploadResponse.response_body) {
          uploadedFiles.taxNumber3GSTINFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("taxNumber3GSTINFile");
          console.log(
            "✅ GSTIN file uploaded successfully:",
            uploadedFiles.taxNumber3GSTINFile
          );
        }
      } else {
        console.log(
          "❌ GSTIN file data format not recognized:",
          typeof formData.taxNumber3GSTINFile
        );
      }
    } else {
      console.log("❌ No GSTIN file data");
    }

    // Handle PAN file
    if (formData.panNumberFile) {
      if (isFileAlreadyUploaded(formData.panNumberFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ PAN file already uploaded, using existing URL:",
          formData.panNumberFile.file_url
        );
        uploadedFiles.panNumberFile = {
          name: formData.panNumberFile.file_name,
          type: formData.panNumberFile.file_type,
          url: formData.panNumberFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log("♻️ PAN file already uploaded, not tracking as changed");
      } else if (formData.panNumberFile instanceof File) {
        // New file, upload it
        console.log("📤 Uploading new PAN file:", formData.panNumberFile.name);
        const base64 = await fileToBase64(formData.panNumberFile);
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.panNumberFile.name,
          file_type: formData.panNumberFile.type,
          file_base64: base64,
        });
        console.log("📤 PAN upload response:", uploadResponse);
        if (uploadResponse.response_body) {
          uploadedFiles.panNumberFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("panNumberFile");
          console.log(
            "✅ PAN file uploaded successfully:",
            uploadedFiles.panNumberFile
          );
        }
      } else {
        console.log(
          "❌ PAN file data format not recognized:",
          typeof formData.panNumberFile
        );
      }
    } else {
      console.log("❌ No PAN file data");
    }

    // Handle MSME file
    if (formData.creditInformationNumberMSMEFile) {
      if (isFileAlreadyUploaded(formData.creditInformationNumberMSMEFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ MSME file already uploaded, using existing URL:",
          formData.creditInformationNumberMSMEFile.file_url
        );
        uploadedFiles.creditInformationNumberMSMEFile = {
          name: formData.creditInformationNumberMSMEFile.file_name,
          type: formData.creditInformationNumberMSMEFile.file_type,
          url: formData.creditInformationNumberMSMEFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log("♻️ MSME file already uploaded, not tracking as changed");
      } else if (formData.creditInformationNumberMSMEFile instanceof File) {
        // New file, upload it
        console.log(
          "📤 Uploading new MSME file:",
          formData.creditInformationNumberMSMEFile.name
        );
        const base64 = await fileToBase64(
          formData.creditInformationNumberMSMEFile
        );
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.creditInformationNumberMSMEFile.name,
          file_type: formData.creditInformationNumberMSMEFile.type,
          file_base64: base64,
        });
        console.log("📤 MSME upload response:", uploadResponse);
        if (uploadResponse.response_body) {
          uploadedFiles.creditInformationNumberMSMEFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("creditInformationNumberMSMEFile");
          console.log(
            "✅ MSME file uploaded successfully:",
            uploadedFiles.creditInformationNumberMSMEFile
          );
        }
      } else {
        console.log(
          "❌ MSME file data format not recognized:",
          typeof formData.creditInformationNumberMSMEFile
        );
      }
    } else {
      console.log("❌ No MSME file data");
    }

    // Handle CIN file
    if (formData.cinNumberFile) {
      if (isFileAlreadyUploaded(formData.cinNumberFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ CIN file already uploaded, using existing URL:",
          formData.cinNumberFile.file_url
        );
        uploadedFiles.cinNumberFile = {
          name: formData.cinNumberFile.file_name,
          type: formData.cinNumberFile.file_type,
          url: formData.cinNumberFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log("♻️ CIN file already uploaded, not tracking as changed");
      } else if (formData.cinNumberFile instanceof File) {
        // New file, upload it
        console.log("📤 Uploading new CIN file:", formData.cinNumberFile.name);
        const base64 = await fileToBase64(formData.cinNumberFile);
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.cinNumberFile.name,
          file_type: formData.cinNumberFile.type,
          file_base64: base64,
        });
        console.log("📤 CIN upload response:", uploadResponse);
        if (uploadResponse.response_body) {
          uploadedFiles.cinNumberFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("cinNumberFile");
          console.log(
            "✅ CIN file uploaded successfully:",
            uploadedFiles.cinNumberFile
          );
        }
      } else {
        console.log(
          "❌ CIN file data format not recognized:",
          typeof formData.cinNumberFile
        );
      }
    } else {
      console.log("❌ No CIN file data");
    }

    // Handle PAN-Aadhar Linked Status file
    if (formData.panAadharLinkedStatusFile) {
      if (isFileAlreadyUploaded(formData.panAadharLinkedStatusFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ PAN-Aadhar Linked Status file already uploaded, using existing URL:",
          formData.panAadharLinkedStatusFile.file_url
        );
        uploadedFiles.panAadharLinkedStatusFile = {
          name: formData.panAadharLinkedStatusFile.file_name,
          type: formData.panAadharLinkedStatusFile.file_type,
          url: formData.panAadharLinkedStatusFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log(
          "♻️ PAN-Aadhar Linked Status file already uploaded, not tracking as changed"
        );
      } else if (formData.panAadharLinkedStatusFile instanceof File) {
        // New file, upload it
        console.log(
          "📤 Uploading new PAN-Aadhar Linked Status file:",
          formData.panAadharLinkedStatusFile.name
        );
        const base64 = await fileToBase64(formData.panAadharLinkedStatusFile);
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.panAadharLinkedStatusFile.name,
          file_type: formData.panAadharLinkedStatusFile.type,
          file_base64: base64,
        });
        console.log(
          "📤 PAN-Aadhar Linked Status upload response:",
          uploadResponse
        );
        if (uploadResponse.response_body) {
          uploadedFiles.panAadharLinkedStatusFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("panAadharLinkedStatusFile");
          console.log(
            "✅ PAN-Aadhar Linked Status file uploaded successfully:",
            uploadedFiles.panAadharLinkedStatusFile
          );
        }
      } else {
        console.log(
          "❌ PAN-Aadhar Linked Status file data format not recognized:",
          typeof formData.panAadharLinkedStatusFile
        );
      }
    } else {
      console.log("❌ No PAN-Aadhar Linked Status file data");
    }

    // Handle Bank Details file
    if (formData.bankKeyIFSCCodeFile) {
      if (isFileAlreadyUploaded(formData.bankKeyIFSCCodeFile)) {
        // File already uploaded, use existing data
        console.log(
          "♻️ Bank Details file already uploaded, using existing URL:",
          formData.bankKeyIFSCCodeFile.file_url
        );
        uploadedFiles.bankKeyIFSCCodeFile = {
          name: formData.bankKeyIFSCCodeFile.file_name,
          type: formData.bankKeyIFSCCodeFile.file_type,
          url: formData.bankKeyIFSCCodeFile.file_url,
        };

        // Don't track already uploaded files as changed (they were uploaded in previous sessions)
        console.log(
          "♻️ Bank Details file already uploaded, not tracking as changed"
        );
      } else if (formData.bankKeyIFSCCodeFile instanceof File) {
        // New file, upload it
        console.log(
          "📤 Uploading new Bank Details file:",
          formData.bankKeyIFSCCodeFile.name
        );
        const base64 = await fileToBase64(formData.bankKeyIFSCCodeFile);
        const uploadResponse = await uploadFileApi({
          org_name: orgName,
          form_name: formName,
          file_name: formData.bankKeyIFSCCodeFile.name,
          file_type: formData.bankKeyIFSCCodeFile.type,
          file_base64: base64,
        });
        console.log("📤 Bank Details upload response:", uploadResponse);
        if (uploadResponse.response_body) {
          uploadedFiles.bankKeyIFSCCodeFile = {
            name: uploadResponse.response_body.file_name,
            type: uploadResponse.response_body.file_type,
            url: uploadResponse.response_body.file_url,
          };
          changedFields.push("bankKeyIFSCCodeFile");
          console.log(
            "✅ Bank Details file uploaded successfully:",
            uploadedFiles.bankKeyIFSCCodeFile
          );
        }
      } else {
        console.log(
          "❌ Bank Details file data format not recognized:",
          typeof formData.bankKeyIFSCCodeFile
        );
      }
    } else {
      console.log("❌ No Bank Details file data");
    }

    // Get changed fields from upload actions (not from form data analysis)
    const actionChangedFields = getChangedFieldsFromActions();

    console.log("📁 Final uploaded files result:", uploadedFiles);
    console.log("📝 Changed fields from new uploads:", changedFields);
    console.log("📝 Changed fields from actions:", actionChangedFields);

    // Combine both lists (remove duplicates)
    const allChangedFields = [
      ...new Set([...changedFields, ...actionChangedFields]),
    ];
    console.log("📝 All changed fields:", allChangedFields);

    return { uploadedFiles, changedFields: allChangedFields };
  };

  /**
   * Refresh file URLs from server after save operation to get permanent URLs
   * This replaces temporary URLs with permanent ones returned by getFormData
   */
  const refreshFileURLs = async (
    formData: VendorFormData,
    orgName: string,
    transactionId: string,
    formName: string = "Vendor Onboarding"
  ): Promise<VendorFormData> => {
    console.log("🔄 Refreshing file URLs to get permanent URLs...");

    try {
      // Import the getVendorDataByTransId function
      const { getVendorDataByTransId } = await import("@/services/form-data");

      // Get updated form data from server
      const { data, error } = await getVendorDataByTransId(
        transactionId,
        orgName,
        formName
      );

      if (error) {
        console.error("❌ Failed to refresh file URLs:", error);
        return formData; // Return original form data if refresh fails
      }

      if (data?.response_body?.[0]?.form_data?.attachments) {
        const serverAttachments = data.response_body[0].form_data.attachments;
        const updatedFormData = { ...formData };

        // Map server attachment fields to form data fields
        const attachmentMappings: Record<string, keyof VendorFormData> = {
          gstin_attachment: "taxNumber3GSTINFile",
          pan_attachment: "panNumberFile",
          msme_attachment: "creditInformationNumberMSMEFile",
          cin_attachment: "cinNumberFile",
          pan_aadhar_linkage_attachment: "panAadharLinkedStatusFile",
          bank_details_attachment: "bankKeyIFSCCodeFile",
        };

        // Update each file field with permanent URL if available
        Object.entries(attachmentMappings).forEach(
          ([serverField, formField]) => {
            const serverAttachment = (serverAttachments as any)[serverField];
            const currentFile = formData[formField];

            if (
              serverAttachment?.file_url &&
              isFileAlreadyUploaded(currentFile)
            ) {
              console.log(
                `🔄 Updating ${formField} with permanent URL:`,
                serverAttachment.file_url
              );
              (updatedFormData as any)[formField] = {
                file_name: serverAttachment.file_name || currentFile.file_name,
                file_type: serverAttachment.file_type || currentFile.file_type,
                file_url: serverAttachment.file_url,
              };
            }
          }
        );

        console.log("✅ File URLs refreshed with permanent URLs");
        return updatedFormData;
      }

      return formData;
    } catch (error) {
      console.error("❌ Error refreshing file URLs:", error);
      return formData; // Return original form data if refresh fails
    }
  };

  /**
   * Get optimized attachment field names for only changed fields
   * This ensures we only pass fields that were actually uploaded/changed
   */
  const getOptimizedAttachmentFieldNames = (
    changedFields: string[]
  ): string[] => {
    const fieldMapping: Record<string, string> = {
      taxNumber3GSTINFile: "gstin_attachment",
      panNumberFile: "pan_attachment",
      creditInformationNumberMSMEFile: "msme_attachment",
      cinNumberFile: "cin_attachment",
      panAadharLinkedStatusFile: "pan_aadhar_linkage_attachment",
      bankKeyIFSCCodeFile: "bank_details_attachment",
    };

    return changedFields.map((field) => fieldMapping[field] || field);
  };

  return {
    uploadFiles,
    refreshFileURLs,
    getOptimizedAttachmentFieldNames,
    markFileAsUploaded,
    markFileAsDeleted,
    clearFileActionTracking,
  };
};
