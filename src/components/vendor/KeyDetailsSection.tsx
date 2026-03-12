import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/common/search-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { getSessionData } from "@/lib/session-utils";
import { useFileUploadContext } from "@/contexts/FileUploadContext";
import type { BaseSectionProps } from "./types";
import {
  isFileUploadMandatory,
  shouldShowFileUploadForKeyDetails,
  getPanAadharLinkedStatusValue,
  shouldPanAadharLinkedStatusBeReadOnly,
  validateGSTIN,
  isCINMandatory,
} from "./validation";
import {
  FileUploadDisplay,
  ExistingFileDisplay,
} from "@/components/files-upload";

const KeyDetailsSection: React.FC<BaseSectionProps> = ({
  formData,
  setFormData,
  errors,
  lovData,
  handleInputChange,
  isReadOnly = false,
  editMode = false,
  hasStep1Data = false,
  validateField,
  updateErrors,
  markFileAsUploaded,
  markFileAsDeleted,
  formName = "Vendor Onboarding",
  // 🔥 NEW: Accept new props for URL refresh
  refreshFileURLs,
  currentFormData,
  orgName,
  transactionId,
  // 🔥 NEW: Accept deleted files tracking props
  addDeletedFile,
  useTrackingMode = false,
}) => {
  void editMode;
  const { uploadFile } = useFileUploadContext();
  const fileInputRefs = {
    taxNumber3GSTIN: React.useRef<HTMLInputElement>(null),
    panNumber: React.useRef<HTMLInputElement>(null),
    creditInformationNumberMSME: React.useRef<HTMLInputElement>(null),
    cinNumber: React.useRef<HTMLInputElement>(null),
    panAadharLinkedStatus: React.useRef<HTMLInputElement>(null),
  };

  console.log(formData, "formData");

  const handleFileUpload = async (
    field: keyof typeof formData,
    file: File | null
  ) => {
    if (file) {
      try {
        const sessionData = getSessionData();
        const uploadedFile = await uploadFile(
          file,
          field as string,
          sessionData.orgName,
          formName
        );

        if (uploadedFile) {
          // Store the uploaded file metadata instead of just the File object
          setFormData((prev) => ({
            ...prev,
            [field]: {
              file_name: uploadedFile.fileName,
              file_type: uploadedFile.fileType,
              file_url: uploadedFile.fileUrl,
            },
          }));

          // Track this file as uploaded for change tracking
          if (markFileAsUploaded) {
            markFileAsUploaded(field);
          }

          // Clear the corresponding file upload error when file is successfully uploaded
          if (updateErrors) {
            updateErrors({ ...errors, [field]: undefined });
          }
        }
      } catch {
        // Error handling is done in the upload context
      }
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof formData
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(field, file);
    }
  };

  const triggerFileInput = (field: keyof typeof fileInputRefs) => {
    const inputRef = fileInputRefs[field];
    if (inputRef?.current) {
      inputRef.current.click();
    }
  };

  const handleFileRemove = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: null,
    }));

    // Track this file as deleted for change tracking
    if (markFileAsDeleted) {
      markFileAsDeleted(field);
    }

    console.log(`🗑️ File ${field} marked as deleted in form data`);
  };

  // Auto-set PAN Aadhar Linked Status based on vendor type and PAN number
  useEffect(() => {
    const panAadharValue = getPanAadharLinkedStatusValue(
      formData.typeOfVendor,
      formData.panNumber
    );

    // Only update if we have a value and it's different from current
    if (panAadharValue && formData.panAadharLinkedStatus !== panAadharValue) {
      handleInputChange("panAadharLinkedStatus", panAadharValue);
    }
  }, [
    formData.typeOfVendor,
    formData.panNumber,
    formData.panAadharLinkedStatus,
    handleInputChange,
  ]);

  // Auto-select MSME Status to Z002-Non-MSMED for Employee(FK01)
  useEffect(() => {
    if (isReadOnly) return;
    if (formData.typeOfVendor !== "Employee(FK01)") return;

    // Find the Z002 option from LOV; fallback to a sensible default value string
    const z002OptionValue =
      lovData?.reMSMEStatus?.find(
        (opt) =>
          (opt.value || "").startsWith("Z002") ||
          (opt.label || "").startsWith("Z002")
      )?.value || "Z002-Non-MSMED";

    if (formData.reMSMEStatus !== z002OptionValue) {
      handleInputChange("reMSMEStatus", z002OptionValue);
    }

    // Ensure MSME number is NA when NON-MSMED
    if ((formData.creditInformationNumberMSME || "").toUpperCase() !== "NA") {
      handleInputChange("creditInformationNumberMSME", "NA");
    }
  }, [
    formData.typeOfVendor,
    lovData?.reMSMEStatus,
    isReadOnly,
    formData.reMSMEStatus,
    formData.creditInformationNumberMSME,
    handleInputChange,
  ]);

  const isEmployeeTypeCinField =
    formData.typeOfVendor === "Employee" ||
    formData.typeOfVendor === "Employee(FK01)";

  // Use new PAN-based logic only (old name-based logic removed)
  const isCinMandatory =
    !isEmployeeTypeCinField &&
    isCINMandatory(
      formData.panNumber || "",
      formData.name1 || "",
      formData.name2 || ""
    );

  const cinPlaceholder = isEmployeeTypeCinField
    ? "NA"
    : isCinMandatory
      ? "Enter CIN Number"
      : "NA";

  const isCinDisabled =
    isReadOnly || isEmployeeTypeCinField || !isCinMandatory;

  // Smart typing handler for CIN input based on PAN 4th character
  const handleCINChange = (value: string) => {
    if (isReadOnly || isCinDisabled) return;

    const panFourthChar = formData.panNumber?.charAt(3)?.toUpperCase();

    // For PAN 4th char = 'F': Format as AAG-12345 (3 letters + hyphen + 1-5 digits)
    if (panFourthChar === "F") {
      // Remove any non-alphanumeric characters except hyphen
      const cleaned = value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase();

      // Extract letters and digits separately
      let letters = "";
      let digits = "";
      let hasHyphen = false;

      // Process each character in order
      for (const char of cleaned) {
        if (char === "-") {
          hasHyphen = true;
          continue;
        }
        // First 3 characters should be letters only
        if (letters.length < 3 && /[A-Z]/.test(char)) {
          letters += char;
        }
        // After 3 letters are entered, accept only digits (up to 5)
        else if (letters.length === 3 && /[0-9]/.test(char) && digits.length < 5) {
          digits += char;
        }
      }

      // Auto-insert hyphen after 3 letters when user starts typing digits
      let formatted = letters;
      if (letters.length === 3 && digits.length > 0) {
        // User has typed 3 letters and is now typing digits - auto-insert hyphen
        formatted += "-" + digits;
      } else if (letters.length === 3 && hasHyphen && digits.length === 0) {
        // User manually typed hyphen after 3 letters, keep it
        formatted += "-";
      }

      handleInputChange("cinNumber", formatted);
    } else {
      // For PAN 4th char = 'C' or other: Allow all alphanumeric, uppercase, max 21 chars
      const processedValue = value
        .replace(/[^0-9A-Za-z]/g, "")
        .toUpperCase()
        .slice(0, 21);
      handleInputChange("cinNumber", processedValue);
    }
  };
  const isForeign = formData.vendorAccountGroup?.toLowerCase().includes("foreign");
  const isEmployee = formData.typeOfVendor === "Employee(FK01)";
  const gstRegistered = formData.gstinRequirement === "Registered"

  const effectivePanAadharStatus =
    getPanAadharLinkedStatusValue(
      formData.typeOfVendor,
      formData.panNumber
    ) || formData.panAadharLinkedStatus;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-3">
              <Label htmlFor="taxNumber3GSTIN">
                Tax Number 3 (GSTIN)
                {(() => {
                  const isEmployeeType =
                    formData.typeOfVendor === "Employee" ||
                    formData.typeOfVendor === "Employee(FK01)";
                  const isGstinNotRequired =
                    formData.gstinRequirement === "Not Registered";
                  return !isEmployeeType && !isGstinNotRequired ? (
                    <span className="text-destructive">*</span>
                  ) : null;
                })()}
                {hasStep1Data && (
                  <span className="text-xs text-primary ml-2"></span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="taxNumber3GSTIN"
                  value={formData.taxNumber3GSTIN}
                  onChange={(e) => {
                    if (!isReadOnly && !hasStep1Data) {
                      const value = e.target.value;
                      handleInputChange("taxNumber3GSTIN", value);

                      // Auto-fill PAN number when "not registered" is typed
                      if (value.toLowerCase().includes("not registered")) {
                        handleInputChange("panNumber", "NOT REGISTER");
                      }
                    }
                  }}
                  placeholder="Enter GSTIN Number"
                  maxLength={15}
                  className={`h-10 w-full pr-10 ${errors.taxNumber3GSTIN
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isReadOnly || hasStep1Data
                      ? "bg-muted cursor-not-allowed"
                      : ""
                    }`}
                  disabled={isReadOnly || hasStep1Data}
                />
                {/* Fixed Upload Icon - Always visible */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <input
                    ref={fileInputRefs.taxNumber3GSTIN}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "taxNumber3GSTINFile")}
                    accept=".pdf"
                  />
                  <Upload
                    className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly &&
                      shouldShowFileUploadForKeyDetails(
                        "taxNumber3GSTIN",
                        formData.taxNumber3GSTIN
                      )
                      ? isFileUploadMandatory(
                        "taxNumber3GSTIN",
                        formData.taxNumber3GSTIN
                      )
                        ? "text-destructive opacity-100"
                        : "text-primary opacity-100"
                      : "text-muted-foreground opacity-30"
                      }`}
                    onClick={() =>
                      !isReadOnly && triggerFileInput("taxNumber3GSTIN")
                    }
                  />
                </div>
              </div>

              {/* Fixed Message Area */}
              <div className="h-[20px] flex items-center">
                {errors.taxNumber3GSTIN && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive ">
                      {errors.taxNumber3GSTIN}
                    </span>
                  </div>
                )}
                {errors.taxNumber3GSTINFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive ">
                      {errors.taxNumber3GSTINFile}
                    </span>
                  </div>
                )}
                {!errors.taxNumber3GSTIN &&
                  !errors.taxNumber3GSTINFile &&
                  !isReadOnly &&
                  shouldShowFileUploadForKeyDetails(
                    "taxNumber3GSTIN",
                    formData.taxNumber3GSTIN
                  ) &&
                  !formData.taxNumber3GSTINFile && (
                    <p className="text-xs text-muted-foreground">
                      {isFileUploadMandatory(
                        "taxNumber3GSTIN",
                        formData.taxNumber3GSTIN
                      )
                        ? "📎 File upload required"
                        : "📎 File upload optional"}
                    </p>
                  )}
                {/* Show uploaded file status */}
                {!errors.taxNumber3GSTIN &&
                  !errors.taxNumber3GSTINFile &&
                  formData.taxNumber3GSTINFile && (
                    <>
                      {formData.taxNumber3GSTINFile &&
                        typeof formData.taxNumber3GSTINFile === "object" &&
                        "file_name" in formData.taxNumber3GSTINFile ? (
                        <ExistingFileDisplay
                          fileData={
                            formData.taxNumber3GSTINFile as unknown as {
                              file_name: string;
                              file_type: string;
                              file_url: string;
                            }
                          }
                          onRemove={() =>
                            handleFileRemove("taxNumber3GSTINFile")
                          }
                          isReadOnly={isReadOnly}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass field name for direct access
                          fieldName="taxNumber3GSTINFile"
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      ) : null}
                    </>
                  )}
              </div>
            </div>

            {/* CIN Number Section - Always visible in view mode so users can see whether it's absent */}
            <div className="space-y-3">
              <Label htmlFor="cinNumber">
                CIN Number
                {!isEmployeeTypeCinField && isCinMandatory ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </Label>
              <div className="relative">
                <Input
                  id="cinNumber"
                  value={formData.cinNumber}
                  onChange={(e) => {
                    handleCINChange(e.target.value);
                  }}
                  onBlur={() => {
                    if (!isReadOnly && validateField) {
                      validateField("cinNumber", formData.cinNumber);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isReadOnly && validateField) {
                      validateField("cinNumber", formData.cinNumber);
                    }
                  }}
                  placeholder={(() => {
                    if (isEmployeeTypeCinField) {
                      return "NA";
                    }

                    return cinPlaceholder;
                  })()}
                  maxLength={
                    formData.panNumber?.charAt(3)?.toUpperCase() === "F"
                      ? 9
                      : 21
                  }
                  className={`h-10 w-full pr-10 ${errors.cinNumber
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isCinDisabled ? "bg-muted cursor-not-allowed" : ""}`}
                  disabled={isCinDisabled}
                />
                {/* Fixed Upload Icon - Always visible */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <input
                    ref={fileInputRefs.cinNumber}
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, "cinNumberFile")}
                    accept=".pdf"
                  />
                  <Upload
                    className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly &&
                      shouldShowFileUploadForKeyDetails(
                        "cinNumber",
                        formData.cinNumber
                      )
                      ? isFileUploadMandatory(
                        "cinNumber",
                        formData.cinNumber,
                        formData.typeOfVendor,
                        formData.panNumber
                      )
                        ? "text-destructive opacity-100"
                        : "text-primary opacity-100"
                      : "text-muted-foreground opacity-30"
                      }`}
                    onClick={() =>
                      !isReadOnly && triggerFileInput("cinNumber")
                    }
                  />
                </div>
              </div>

              {/* Fixed Message Area */}
              <div className="h-[20px] flex items-center">
                {errors.cinNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm ">
                      {errors.cinNumber}
                    </span>
                  </div>
                )}
                {errors.cinNumberFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm ">
                      {errors.cinNumberFile}
                    </span>
                  </div>
                )}
                {!errors.cinNumber &&
                  !errors.cinNumberFile &&
                  (() => {
                    if (isEmployeeTypeCinField) {
                      return null;
                    }

                    // Show blue informational message only when field is empty and it's a company type
                    if (isCinMandatory && !formData.cinNumber && !isReadOnly) {
                      return (
                        <p className="text-xs text-primary">
                          {/* ℹ️ CIN Number is mandatory for Limited/Ltd/LLP
                              companies unless the name includes Co-op,
                              Housing, CHS, or Society */}
                        </p>
                      );
                    }

                    // Show file upload message
                    if (
                      !isReadOnly &&
                      shouldShowFileUploadForKeyDetails(
                        "cinNumber",
                        formData.cinNumber
                      ) &&
                      !formData.cinNumberFile
                    ) {
                      return (
                        <p className="text-xs text-muted-foreground">
                          {isFileUploadMandatory(
                            "cinNumber",
                            formData.cinNumber,
                            formData.typeOfVendor,
                            formData.panNumber
                          )
                            ? "📎 File upload required"
                            : "📎 File upload optional"}
                        </p>
                      );
                    }

                    return null;
                  })()}
                {/* Show uploaded file status */}
                {!errors.cinNumber &&
                  !errors.cinNumberFile &&
                  !(isCinMandatory && !formData.cinNumber && !isReadOnly) &&
                  !(
                    !isReadOnly &&
                    shouldShowFileUploadForKeyDetails(
                      "cinNumber",
                      formData.cinNumber
                    ) &&
                    !formData.cinNumberFile
                  ) && (
                    <>
                      {formData.cinNumberFile &&
                        typeof formData.cinNumberFile === "object" &&
                        "file_name" in formData.cinNumberFile &&
                        formData.cinNumberFile.file_name.trim() !== "" ? (
                        <ExistingFileDisplay
                          fileData={
                            formData.cinNumberFile as unknown as {
                              file_name: string;
                              file_type: string;
                              file_url: string;
                            }
                          }
                          onRemove={() => handleFileRemove("cinNumberFile")}
                          isReadOnly={isReadOnly}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass field name for direct access
                          fieldName="cinNumberFile"
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      ) : (
                        <FileUploadDisplay
                          fieldName="cinNumberFile"
                          onRemove={() => handleFileRemove("cinNumberFile")}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      )}
                    </>
                  )}
              </div>
            </div>

            {/* Pan Aadhar linked status */}
            <div className="space-y-3">

              <Label htmlFor="panAadharLinkedStatus">
                PAN Aadhar Linked Status{" "}
                <span className="text-destructive">*</span>
              </Label>

              <div className="relative">
                {(() => {
                  const isReadOnlyField = shouldPanAadharLinkedStatusBeReadOnly(
                    formData.typeOfVendor,
                    formData.panNumber
                  );
                  const panAadharValue = getPanAadharLinkedStatusValue(
                    formData.typeOfVendor,
                    formData.panNumber
                  );

                  // If field should be read-only, show Input with calculated value
                  if (isReadOnlyField && panAadharValue) {
                    const displayText =
                      panAadharValue === "1"
                        ? "1 - Pan and Aadhar Linked"
                        : "2 - Not Applicable";
                    return (
                      <Input
                        value={displayText}
                        readOnly
                        className="h-10 w-full pr-10 bg-muted text-muted-foreground cursor-not-allowed focus:ring-0 focus:border-border hover:border-border"
                      />
                    );
                  }

                  // If field is not read-only yet (PAN not entered), show dropdown
                  // But make it disabled if form is read-only
                  return (
                    <div className="relative">
                      <SearchableSelect
                        options={[{ value: "2", label: "2 - Not Applicable" }]}
                        value={formData.panAadharLinkedStatus}
                        onValueChange={(value) => {
                          if (!isReadOnly) {
                            handleInputChange("panAadharLinkedStatus", value);
                          }
                        }}
                        placeholder="Select PAN-Aadhar status"
                        searchPlaceholder="Search PAN Aadhar status..."
                        emptyMessage="No PAN Aadhar status found"
                        triggerClassName="h-10 w-full pr-10"
                        disabled={isReadOnly || isReadOnlyField}
                      />
                    </div>
                  );
                })()}

                {/* Fixed Upload Icon - Always visible */}
                {formData?.typeOfVendor !== "Employee(FK01)" &&
                  effectivePanAadharStatus !== "2" && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Input
                        ref={fileInputRefs.panAadharLinkedStatus}
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e, "panAadharLinkedStatusFile")
                        }
                        accept=".pdf"
                      />

                      <Upload
                        className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly &&
                          shouldShowFileUploadForKeyDetails(
                            "panAadharLinkedStatus",
                            getPanAadharLinkedStatusValue(
                              formData.typeOfVendor,
                              formData.panNumber
                            ) || formData.panAadharLinkedStatus,
                            formData.typeOfVendor
                          )
                          ? isFileUploadMandatory(
                            "panAadharLinkedStatus",
                            getPanAadharLinkedStatusValue(
                              formData.typeOfVendor,
                              formData.panNumber
                            ) || formData.panAadharLinkedStatus,
                            formData.typeOfVendor
                          )
                            ? "text-destructive opacity-100"
                            : "text-primary opacity-100"
                          : "text-muted-foreground opacity-30"
                          }`}
                        onClick={() =>
                          !isReadOnly && triggerFileInput("panAadharLinkedStatus")
                        }
                      />
                    </div>
                  )}
              </div>

              {/* Fixed Message Area */}
              <div className="h-[20px] flex items-center">
                {errors.panAadharLinkedStatus && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-destructive font-bold">
                      {errors.panAadharLinkedStatus}
                    </span>
                  </div>
                )}
                {errors.panAadharLinkedStatusFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-destructive font-bold">
                      {errors.panAadharLinkedStatusFile}
                    </span>
                  </div>
                )}
                {!errors.panAadharLinkedStatus &&
                  !errors.panAadharLinkedStatusFile &&
                  !isReadOnly &&
                  shouldShowFileUploadForKeyDetails(
                    "panAadharLinkedStatus",
                    getPanAadharLinkedStatusValue(
                      formData.typeOfVendor,
                      formData.panNumber
                    ) || formData.panAadharLinkedStatus,
                    formData.typeOfVendor
                  ) &&
                  !formData.panAadharLinkedStatusFile && (
                    <p className="text-xs text-muted-foreground">
                      {isFileUploadMandatory(
                        "panAadharLinkedStatus",
                        getPanAadharLinkedStatusValue(
                          formData.typeOfVendor,
                          formData.panNumber
                        ) || formData.panAadharLinkedStatus,
                        formData.typeOfVendor
                      )
                        ? "📎 File upload required"
                        : ""}
                    </p>
                  )}
                {/* Show uploaded file status */}
                {!errors.panAadharLinkedStatus &&
                  !errors.panAadharLinkedStatusFile &&
                  !(
                    !isReadOnly &&
                    shouldShowFileUploadForKeyDetails(
                      "panAadharLinkedStatus",
                      getPanAadharLinkedStatusValue(
                        formData.typeOfVendor,
                        formData.panNumber
                      ) || formData.panAadharLinkedStatus,
                      formData.typeOfVendor
                    ) &&
                    !formData.panAadharLinkedStatusFile
                  ) && (
                    <>
                      {formData.panAadharLinkedStatusFile &&
                        typeof formData.panAadharLinkedStatusFile === "object" &&
                        "file_name" in formData.panAadharLinkedStatusFile ? (
                        <ExistingFileDisplay
                          fileData={
                            formData.panAadharLinkedStatusFile as unknown as {
                              file_name: string;
                              file_type: string;
                              file_url: string;
                            }
                          }
                          onRemove={() =>
                            handleFileRemove("panAadharLinkedStatusFile")
                          }
                          isReadOnly={isReadOnly}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass field name for direct access
                          fieldName="panAadharLinkedStatusFile"
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      ) : (
                        <FileUploadDisplay
                          fieldName="panAadharLinkedStatusFile"
                          onRemove={() =>
                            handleFileRemove("panAadharLinkedStatusFile")
                          }
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      )}
                    </>
                  )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-3">
              <Label htmlFor="panNumber">
                PAN Number
                {(() => {
                  const isForeign = formData.vendorAccountGroup?.toLowerCase().includes("foreign");
                  const isEmployee =
                    formData.typeOfVendor === "Employee" ||
                    formData.typeOfVendor === "Employee(FK01)";
                  const gstRegistered = formData.gstinRequirement === "Registered";

                  // PAN mandatory only for: Indian vendor + GSTIN Not Registered
                  if (!isForeign && !isEmployee && !gstRegistered) {
                    return <span className="text-destructive">*</span>;
                  }
                  return null;
                })()}

                {hasStep1Data && (
                  <span className="text-xs text-primary ml-2"></span>
                )}
              </Label>
              <div className="relative">
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) => {
                    if (isReadOnly) return;

                    const raw = e.target.value.toUpperCase().trim();

                    const isForeign = formData.vendorAccountGroup?.toLowerCase().includes("foreign");
                    const isEmployee = formData.typeOfVendor === "Employee(FK01)";
                    const gstRegistered = formData.gstinRequirement === "Registered";

                    const panOptional = isForeign || isEmployee || gstRegistered;

                    // Allow NA if PAN is optional
                    if (panOptional && (raw === "NA" || raw === "NOT APPLICABLE")) {
                      handleInputChange("panNumber", raw);
                      return;
                    }

                    // Otherwise apply strict PAN formatting
                    const processed = raw.replace(/[^A-Z0-9]/g, "").slice(0, 10);
                    handleInputChange("panNumber", processed);
                  }}

                  onBlur={() => {
                    if (!isReadOnly && validateField) {
                      validateField("panNumber", formData.panNumber);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isReadOnly && validateField) {
                      validateField("panNumber", formData.panNumber);
                    }
                  }}
                  placeholder="Enter PAN Number"
                  maxLength={10}
                  className={`h-10 w-full pr-10 ${errors.panNumber
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isReadOnly ||
                      (hasStep1Data && formData.typeOfVendor !== "Employee(FK01)")
                      ? "bg-muted cursor-not-allowed"
                      : ""
                    }`}
                  disabled={
                    isReadOnly ||
                    (gstRegistered && !isForeign && !isEmployee) || // auto-populated
                    (hasStep1Data && !isEmployee) // step 1 imported PAN
                  }
                />
                {/* Upload icon hidden when PAN auto-extracted from valid GSTIN */}
                {!(
                  validateGSTIN(formData.taxNumber3GSTIN) &&
                  formData.panNumber ===
                  formData.taxNumber3GSTIN.substring(2, 12)
                ) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <input
                        ref={fileInputRefs.panNumber}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "panNumberFile")}
                        accept=".pdf"
                      />
                      <Upload
                        className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly &&
                          shouldShowFileUploadForKeyDetails(
                            "panNumber",
                            formData.panNumber
                          )
                          ? isFileUploadMandatory(
                            "panNumber",
                            formData.panNumber
                          )
                            ? "text-destructive opacity-100"
                            : "text-primary opacity-100"
                          : "text-muted-foreground opacity-30"
                          }`}
                        onClick={() => !isReadOnly && triggerFileInput("panNumber")}
                      />
                    </div>
                  )}
              </div>

              {/* Fixed Message Area */}
              <div className="h-[20px] flex items-center">
                {errors.panNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-destructive font-bold">
                      {errors.panNumber}
                    </span>
                  </div>
                )}
                {errors.panNumberFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-destructive font-bold">
                      {errors.panNumberFile}
                    </span>
                  </div>
                )}
                {!errors.panNumber &&
                  !errors.panNumberFile &&
                  !isReadOnly &&
                  shouldShowFileUploadForKeyDetails(
                    "panNumber",
                    formData.panNumber
                  ) &&
                  !(
                    validateGSTIN(formData.taxNumber3GSTIN) &&
                    formData.panNumber ===
                    formData.taxNumber3GSTIN.substring(2, 12)
                  ) &&
                  !formData.panNumberFile && (
                    <p className="text-xs text-muted-foreground">
                      {isFileUploadMandatory("panNumber", formData.panNumber)
                        ? "📎 File upload required"
                        : "📎 File upload optional"}
                    </p>
                  )}
                {/* Show uploaded file status */}
                {!errors.panNumber &&
                  !errors.panNumberFile &&
                  !(
                    !isReadOnly &&
                    shouldShowFileUploadForKeyDetails(
                      "panNumber",
                      formData.panNumber
                    ) &&
                    !(
                      validateGSTIN(formData.taxNumber3GSTIN) &&
                      formData.panNumber ===
                      formData.taxNumber3GSTIN.substring(2, 12)
                    ) &&
                    !formData.panNumberFile
                  ) && (
                    <>
                      {formData.panNumberFile &&
                        typeof formData.panNumberFile === "object" &&
                        "file_name" in formData.panNumberFile ? (
                        <ExistingFileDisplay
                          fileData={
                            formData.panNumberFile as unknown as {
                              file_name: string;
                              file_type: string;
                              file_url: string;
                            }
                          }
                          onRemove={() => handleFileRemove("panNumberFile")}
                          isReadOnly={isReadOnly}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass field name for direct access
                          fieldName="panNumberFile"
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      ) : (
                        <FileUploadDisplay
                          fieldName="panNumberFile"
                          onRemove={() => handleFileRemove("panNumberFile")}
                          // 🔥 NEW: Pass refreshFileURLs props
                          refreshFileURLs={refreshFileURLs}
                          currentFormData={currentFormData}
                          orgName={orgName}
                          transactionId={transactionId}
                          // 🔥 NEW: Pass deleted files tracking props
                          addDeletedFile={addDeletedFile}
                          useTrackingMode={useTrackingMode}
                        />
                      )}
                    </>
                  )}
              </div>
            </div>

            {/* MSME Status - moved above Credit Information Number */}
            <div className="space-y-3">
              <Label htmlFor="reMSMEStatus">
                MSME Status <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={lovData?.reMSMEStatus || []}
                value={formData.reMSMEStatus}
                onValueChange={(value) => {
                  if (!isReadOnly) {
                    handleInputChange("reMSMEStatus", value);
                    // If NON-MSMED, auto-set MSME to NA and make read-only via below control
                    if ((value || "").startsWith("Z002")) {
                      handleInputChange("creditInformationNumberMSME", "NA");
                    } else {
                      // Switching away from Z002: clear NA so user can enter 11 digits
                      if (
                        (
                          formData.creditInformationNumberMSME || ""
                        ).toUpperCase() === "NA"
                      ) {
                        handleInputChange("creditInformationNumberMSME", "");
                      }
                    }
                  }
                }}
                placeholder="Select Status"
                searchPlaceholder="Search MSME status..."
                emptyMessage="No MSME status found"
                triggerClassName="h-10 w-full"
                disabled={
                  isReadOnly ||
                  formData.typeOfVendor === "Employee(FK01)" ||
                  formData.typeOfVendor === "Employee"
                }
              />
              <div className="space-y-1">
                {errors.reMSMEStatus && (
                  <div className="flex items-center text-sm">
                    <span className="text-destructive ">
                      {errors.reMSMEStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* <div className="h-20"> */}
            <div className="space-y-3 mt-13">
              <Label htmlFor="creditInformationNumberMSME">
                Credit Information Number (MSME){" "}
                {(() => {
                  const isNonMSMEDStatus = (
                    formData.reMSMEStatus || ""
                  ).startsWith("Z002");
                  return !isNonMSMEDStatus ? (
                    <span className="text-destructive">*</span>
                  ) : null;
                })()}
              </Label>
              <div className="relative">
                <Input
                  id="creditInformationNumberMSME"
                  value={formData.creditInformationNumberMSME}
                  onChange={(e) => {
                    if (!isReadOnly) {
                      const upper = e.target.value.toUpperCase();
                      const alnum = upper.replace(/[^A-Z0-9]/gi, "");
                      let part1 = ""; // 2 letters
                      let part2 = ""; // 2 digits
                      let part3 = ""; // 7 digits
                      for (const ch of alnum) {
                        if (part1.length < 2 && /[A-Z]/.test(ch)) {
                          part1 += ch;
                          continue;
                        }
                        if (part2.length < 2 && /[0-9]/.test(ch)) {
                          part2 += ch;
                          continue;
                        }
                        if (part3.length < 7 && /[0-9]/.test(ch)) {
                          part3 += ch;
                          continue;
                        }
                      }
                      let formatted = part1;
                      if (part1.length === 2) {
                        formatted += "-" + part2;
                        if (part2.length === 2) {
                          formatted += "-" + part3;
                        }
                      }
                      // Limit to max length of pattern (13)
                      const limited = formatted.slice(0, 13);
                      handleInputChange("creditInformationNumberMSME", limited);
                    }
                  }}
                  onBlur={() => {
                    if (!isReadOnly && validateField) {
                      validateField(
                        "creditInformationNumberMSME",
                        formData.creditInformationNumberMSME
                      );
                    }
                  }}
                  placeholder={
                    (formData.reMSMEStatus || "").startsWith("Z002")
                      ? "NA"
                      : "Enter 13 digits MSME number (eg. XY-12-5643256)"
                  }
                  maxLength={13}
                  className={`h-10 w-full pr-10 ${errors.creditInformationNumberMSME
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isReadOnly ||
                      (formData.reMSMEStatus || "").startsWith("Z002")
                      ? "bg-muted cursor-not-allowed"
                      : ""
                    }`}
                  disabled={
                    isReadOnly ||
                    (formData.reMSMEStatus || "").startsWith("Z002")
                  }
                />
                {/* Upload icon hidden when status Z002 or value NA */}
                {!(
                  (formData.reMSMEStatus || "").startsWith("Z002") ||
                  (formData.creditInformationNumberMSME || "").toUpperCase() ===
                  "NA"
                ) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <input
                        ref={fileInputRefs.creditInformationNumberMSME}
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          handleFileSelect(e, "creditInformationNumberMSMEFile")
                        }
                        accept=".pdf"
                      />
                      <Upload
                        className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly &&
                          shouldShowFileUploadForKeyDetails(
                            "creditInformationNumberMSME",
                            formData.creditInformationNumberMSME
                          )
                          ? isFileUploadMandatory(
                            "creditInformationNumberMSME",
                            formData.creditInformationNumberMSME
                          )
                            ? "text-destructive opacity-100"
                            : "text-primary opacity-100"
                          : "text-muted-foreground opacity-30"
                          }`}
                        onClick={() =>
                          !isReadOnly &&
                          triggerFileInput("creditInformationNumberMSME")
                        }
                      />
                    </div>
                  )}
              </div>

              {/* Fixed Message Area - hidden when status Z002 or value NA */}
              {!(
                (formData.reMSMEStatus || "").startsWith("Z002") ||
                (formData.creditInformationNumberMSME || "").toUpperCase() ===
                "NA"
              ) && (
                  <div className="h-[20px] flex items-center">
                    {errors.creditInformationNumberMSME && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive ">
                          {errors.creditInformationNumberMSME}
                        </span>
                      </div>
                    )}
                    {errors.creditInformationNumberMSMEFile && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-destructive ">
                          {errors.creditInformationNumberMSMEFile}
                        </span>
                      </div>
                    )}
                    {!errors.creditInformationNumberMSME &&
                      !errors.creditInformationNumberMSMEFile &&
                      !isReadOnly &&
                      !(
                        (formData.reMSMEStatus || "").startsWith("Z002") ||
                        (
                          formData.creditInformationNumberMSME || ""
                        ).toUpperCase() === "NA"
                      ) &&
                      shouldShowFileUploadForKeyDetails(
                        "creditInformationNumberMSME",
                        formData.creditInformationNumberMSME
                      ) &&
                      !formData.creditInformationNumberMSMEFile && (
                        <p className="text-xs text-muted-foreground">
                          {isFileUploadMandatory(
                            "creditInformationNumberMSME",
                            formData.creditInformationNumberMSME
                          )
                            ? "📎 File upload required"
                            : "📎 File upload optional"}
                        </p>
                      )}
                    {/* Show uploaded file status */}
                    {!errors.creditInformationNumberMSME &&
                      !errors.creditInformationNumberMSMEFile &&
                      !(
                        !isReadOnly &&
                        !(
                          (formData.reMSMEStatus || "").startsWith("Z002") ||
                          (
                            formData.creditInformationNumberMSME || ""
                          ).toUpperCase() === "NA"
                        ) &&
                        shouldShowFileUploadForKeyDetails(
                          "creditInformationNumberMSME",
                          formData.creditInformationNumberMSME
                        ) &&
                        !formData.creditInformationNumberMSMEFile
                      ) && (
                        <>
                          {formData.creditInformationNumberMSMEFile &&
                            typeof formData.creditInformationNumberMSMEFile ===
                            "object" &&
                            "file_name" in
                            formData.creditInformationNumberMSMEFile &&
                            formData.creditInformationNumberMSMEFile.file_name?.trim?.() !==
                            "" ? (
                            <ExistingFileDisplay
                              fileData={
                                formData.creditInformationNumberMSMEFile as unknown as {
                                  file_name: string;
                                  file_type: string;
                                  file_url: string;
                                }
                              }
                              onRemove={() =>
                                handleFileRemove(
                                  "creditInformationNumberMSMEFile"
                                )
                              }
                              isReadOnly={isReadOnly}
                              // 🔥 NEW: Pass refreshFileURLs props
                              refreshFileURLs={refreshFileURLs}
                              currentFormData={currentFormData}
                              orgName={orgName}
                              transactionId={transactionId}
                              // 🔥 NEW: Pass field name for direct access
                              fieldName="creditInformationNumberMSMEFile"
                              // 🔥 NEW: Pass deleted files tracking props
                              addDeletedFile={addDeletedFile}
                              useTrackingMode={useTrackingMode}
                            />
                          ) : (
                            <FileUploadDisplay
                              fieldName="creditInformationNumberMSMEFile"
                              onRemove={() =>
                                handleFileRemove(
                                  "creditInformationNumberMSMEFile"
                                )
                              }
                              // 🔥 NEW: Pass refreshFileURLs props
                              refreshFileURLs={refreshFileURLs}
                              currentFormData={currentFormData}
                              orgName={orgName}
                              transactionId={transactionId}
                              // 🔥 NEW: Pass deleted files tracking props
                              addDeletedFile={addDeletedFile}
                              useTrackingMode={useTrackingMode}
                            />
                          )}
                        </>
                      )}
                  </div>
                )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyDetailsSection;
