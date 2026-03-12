import React, { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { getSessionData } from "@/lib/session-utils";
import { useFileUploadContext } from "@/contexts/FileUploadContext";
import type { BaseSectionProps } from "./types";
import {
  FileUploadDisplay,
  ExistingFileDisplay,
} from "@/components/files-upload";
import { isBankDetailsMandatory } from "./validation";

const BankDetailsSection: React.FC<BaseSectionProps> = ({
  formData,
  setFormData,
  errors,
  lovData,
  handleInputChange,
  isReadOnly = false,
  editMode = false,
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
  validateField,
}) => {
  const { uploadFile } = useFileUploadContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showWarnings, setShowWarnings] = useState(false);

  // Field references for auto-focus
  const bankKeyIFSCCodeRef = useRef<HTMLInputElement>(null);
  const bankAccountNumberRef = useRef<HTMLInputElement>(null);
  const accountHolderNameRef = useRef<HTMLInputElement>(null);
  console.log(errors, "errors");
  // IFSC Code validation function
  const validateIFSC = (ifsc: string): boolean => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    return ifscRegex.test(ifsc);
  };

  // Helper function to format account holder name with title case
  const formatAccountHolderName = (value: string): string => {
    // First, allow only alphanumeric, spaces, and dots
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s.]/g, "");

    // Apply title case: capitalize first letter of each word, lowercase the rest
    const formattedValue = sanitizedValue.replace(/\b([a-zA-Z])(\w*)/g, (_match: string, first: string, rest: string) =>
      first.toUpperCase() + rest.toLowerCase()
    );

    return formattedValue;
  };

  // Helper function to format bank account number - allow only alphanumeric characters
  const formatBankAccountNumber = (value: string): string => {
    // Allow only alphanumeric characters
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, "");
    return sanitizedValue;
  };

  // Helper function to check if file upload should be shown
  const shouldShowFileUpload = (): boolean => {
    // Show file upload if bank details are mandatory for this vendor account group
    return isBankMandatory;
  };

  // Helper function to check if file upload is mandatory
  const isFileUploadMandatory = (): boolean => {
    return isBankMandatory;
  };

  const handleFileUpload = async (file: File | null) => {
    if (file) {
      try {
        const sessionData = getSessionData();
        const uploadedFile = await uploadFile(
          file,
          "bankKeyIFSCCodeFile",
          sessionData.orgName,
          formName
        );

        if (uploadedFile) {
          // Store the uploaded file metadata instead of just the File object
          setFormData((prev) => ({
            ...prev,
            bankKeyIFSCCodeFile: {
              file_name: uploadedFile.fileName,
              file_type: uploadedFile.fileType,
              file_url: uploadedFile.fileUrl,
            },
          }));

          // Track this file as uploaded for change tracking
          if (markFileAsUploaded) {
            markFileAsUploaded("bankKeyIFSCCodeFile");
          }

          // Clear the corresponding file upload error when file is successfully uploaded
          if (updateErrors) {
            updateErrors({ ...errors, bankKeyIFSCCodeFile: undefined });
          }
        }
      } catch {
        // Error handling is done in the upload context
      }
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileRemove = () => {
    setFormData((prev) => ({
      ...prev,
      bankKeyIFSCCodeFile: null,
    }));

    // Track this file as deleted for change tracking
    if (markFileAsDeleted) {
      markFileAsDeleted("bankKeyIFSCCodeFile");
    }
  };

  // Check if bank details are mandatory based on vendor account group
  const isBankMandatory = isBankDetailsMandatory(
    formData.vendorAccountGroup,
    lovData
  );

  // Handle clicks on disabled fields to show warnings
  const handleDisabledFieldClick = () => {
    if (!formData.bankKeyIFSCCode) {
      setShowWarnings(true);
    }
  };

  // Reset warnings when IFSC code is entered
  useEffect(() => {
    if (formData.bankKeyIFSCCode && showWarnings) {
      setShowWarnings(false);
    }
  }, [formData.bankKeyIFSCCode, showWarnings]);

  // Helper function to focus on the next logical field
  const focusNextField = (currentField: string) => {
    setTimeout(() => {
      switch (currentField) {
        case "bankKeyIFSCCode":
          if (validateIFSC(formData.bankKeyIFSCCode)) {
            bankAccountNumberRef.current?.focus();
          }
          break;
        case "bankAccountNumber":
          accountHolderNameRef.current?.focus();
          break;
      }
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bank Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-3">
              <Label htmlFor="bankKeyIFSCCode">
                Bank Key (IFSC Code)
                {isBankMandatory && <span className="text-destructive">*</span>}
              </Label>
              <div className="relative">
                <Input
                  ref={bankKeyIFSCCodeRef}
                  id="bankKeyIFSCCode"
                  value={formData.bankKeyIFSCCode}
                  onChange={(e) => {
                    if (!isReadOnly) {
                      handleInputChange(
                        "bankKeyIFSCCode",
                        e.target.value.toUpperCase()
                      );
                    }
                  }}
                  onBlur={() => {
                    if (!isReadOnly && validateField) {
                      validateField(
                        "bankKeyIFSCCode",
                        formData.bankKeyIFSCCode
                      );
                    }
                  }}
                  onKeyDown={(e) => {
                    if (
                      (e.key === "Enter" || e.key === "Tab") &&
                      !isReadOnly &&
                      validateField
                    ) {
                      validateField(
                        "bankKeyIFSCCode",
                        formData.bankKeyIFSCCode
                      );
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      focusNextField("bankKeyIFSCCode");
                    }
                  }}
                  placeholder="Enter IFSC Code (e.g., SBIN0005943)"
                  maxLength={11}
                  tabIndex={201}
                  className={`h-10 w-full pr-10 ${errors.bankKeyIFSCCode
                    ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                    : ""
                    } ${isReadOnly ? "bg-muted cursor-not-allowed" : ""}`}
                  disabled={isReadOnly}
                />
                {/* Fixed Upload Icon - Always visible */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf"
                  />
                  <Upload
                    className={`h-4 w-4 cursor-pointer transition-opacity ${!isReadOnly && shouldShowFileUpload()
                      ? isFileUploadMandatory()
                        ? "text-destructive opacity-100"
                        : "text-primary opacity-100"
                      : "text-muted-foreground opacity-30"
                      }`}
                    onClick={() => !isReadOnly && triggerFileInput()}
                  />
                </div>
              </div>

              {/* Fixed Message Area */}
              <div className="flex flex-col gap-1">
                {errors.bankKeyIFSCCode && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm">
                      {errors.bankKeyIFSCCode}
                    </span>
                  </div>
                )}
                {errors.bankKeyIFSCCodeFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm">
                      {errors.bankKeyIFSCCodeFile}
                    </span>
                  </div>
                )}
                {!errors.bankKeyIFSCCode &&
                  !errors.bankKeyIFSCCodeFile &&
                  formData.bankKeyIFSCCode &&
                  !validateIFSC(formData.bankKeyIFSCCode) &&
                  formData.bankKeyIFSCCode.length === 11 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-destructive text-sm">
                        Invalid IFSC format. Please check and try again
                      </span>
                    </div>
                  )}
                {!errors.bankKeyIFSCCode &&
                  !errors.bankKeyIFSCCodeFile &&
                  !formData.bankKeyIFSCCode &&
                  !isReadOnly &&
                  shouldShowFileUpload() &&
                  !formData.bankKeyIFSCCodeFile && (
                    <p className="text-xs text-muted-foreground">
                      {isFileUploadMandatory()
                        ? "📎 Bank details document is mandatory for this vendor account group"
                        : "📎 File upload optional"}
                    </p>
                  )}
                {formData.bankKeyIFSCCodeFile && (
                  <>
                    {typeof formData.bankKeyIFSCCodeFile === "object" &&
                      "file_name" in formData.bankKeyIFSCCodeFile ? (
                      <ExistingFileDisplay
                        fileData={
                          formData.bankKeyIFSCCodeFile as unknown as {
                            file_name: string;
                            file_type: string;
                            file_url: string;
                          }
                        }
                        onRemove={handleFileRemove}
                        isReadOnly={isReadOnly}
                        // 🔥 NEW: Pass refreshFileURLs props
                        refreshFileURLs={refreshFileURLs}
                        currentFormData={currentFormData}
                        orgName={orgName}
                        transactionId={transactionId}
                        // 🔥 NEW: Pass field name for direct access
                        fieldName="bankKeyIFSCCodeFile"
                        // 🔥 NEW: Pass deleted files tracking props
                        addDeletedFile={addDeletedFile}
                        useTrackingMode={useTrackingMode}
                      />
                    ) : (
                      <FileUploadDisplay
                        fieldName="bankKeyIFSCCodeFile"
                        onRemove={handleFileRemove}
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

            <div className="space-y-3 mb-2 mt-8">
              <Label htmlFor="accountHolderName">
                Account Holder Name
                {(formData.bankKeyIFSCCode || isBankMandatory) && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                ref={accountHolderNameRef}
                id="accountHolderName"
                value={formData.accountHolderName}
                onChange={(e) => {
                  if (
                    !isReadOnly &&
                    (formData.bankKeyIFSCCode || isBankMandatory)
                  ) {
                    // Format value: allow only alphanumeric, spaces, and dots with title case
                    const formattedValue = formatAccountHolderName(e.target.value);
                    handleInputChange("accountHolderName", formattedValue);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField(
                      "accountHolderName",
                      formData.accountHolderName
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField(
                      "accountHolderName",
                      formData.accountHolderName
                    );
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("accountHolderName");
                  }
                }}
                onClick={handleDisabledFieldClick}
                placeholder={
                  formData.bankKeyIFSCCode || isBankMandatory
                    ? "Enter Account Holder Name"
                    : "Enter IFSC Code first"
                }
                maxLength={60}
                tabIndex={203}
                disabled={
                  (!formData.bankKeyIFSCCode && !isBankMandatory) || isReadOnly
                }
                className={`h-10 w-full ${errors.accountHolderName
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${(!formData.bankKeyIFSCCode && !isBankMandatory) || isReadOnly
                    ? "bg-muted cursor-not-allowed"
                    : ""
                  }`}
              />
              <div className="h-[20px] flex items-center">
                {errors.accountHolderName && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm">
                      {errors.accountHolderName}
                    </span>
                  </div>
                )}
                {!errors.accountHolderName &&
                  !formData.bankKeyIFSCCode &&
                  !isBankMandatory &&
                  showWarnings && (
                    <span className="text-xs text-muted-foreground">
                      Please enter IFSC Code first to enable this field
                    </span>
                  )}
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="bankCountryKey">Bank Country Key</Label>
              <Input
                id="bankCountryKey"
                value={formData.bankKeyIFSCCode ? "IN" : ""}
                placeholder={
                  formData.bankKeyIFSCCode
                    ? "IN (auto-filled)"
                    : "Auto-fills when IFSC entered"
                }
                readOnly
                tabIndex={204}
                className="h-10 w-full bg-muted focus:ring-0 focus:border-border hover:border-border cursor-default"
              />
              <div className="h-[20px] flex items-center">
                {!formData.bankKeyIFSCCode &&
                  !isBankMandatory &&
                  showWarnings && (
                    <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 px-3 py-2 rounded-md border border-primary/20">
                      <span className="text-primary">💡</span>
                      <span>
                        This field will auto-fill when you enter a valid IFSC
                        Code
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4 w-full">
            <div className="space-y-3">
              <Label htmlFor="bankAccountNumber">
                Bank Account Number
                {(formData.bankKeyIFSCCode || isBankMandatory) && (
                  <span className="text-destructive">*</span>
                )}
              </Label>
              <Input
                ref={bankAccountNumberRef}
                id="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={(e) => {
                  if (
                    !isReadOnly &&
                    (formData.bankKeyIFSCCode || isBankMandatory)
                  ) {
                    // Format value: allow only alphanumeric characters
                    const formattedValue = formatBankAccountNumber(e.target.value);
                    handleInputChange("bankAccountNumber", formattedValue);
                  }
                }}
                onBlur={() => {
                  if (!isReadOnly && validateField) {
                    validateField(
                      "bankAccountNumber",
                      formData.bankAccountNumber
                    );
                  }
                }}
                onKeyDown={(e) => {
                  if (
                    (e.key === "Enter" || e.key === "Tab") &&
                    !isReadOnly &&
                    validateField
                  ) {
                    validateField(
                      "bankAccountNumber",
                      formData.bankAccountNumber
                    );
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    focusNextField("bankAccountNumber");
                  }
                }}
                onClick={handleDisabledFieldClick}
                placeholder={
                  formData.bankKeyIFSCCode || isBankMandatory
                    ? "Enter Bank Account Number"
                    : "Enter IFSC Code first"
                }
                maxLength={18}
                tabIndex={202}
                disabled={
                  (!formData.bankKeyIFSCCode && !isBankMandatory) || isReadOnly
                }
                className={`h-10 w-full ${errors.bankAccountNumber
                  ? "border-destructive bg-destructive/10 focus:border-destructive focus:ring-destructive"
                  : ""
                  } ${(!formData.bankKeyIFSCCode && !isBankMandatory) || isReadOnly
                    ? "bg-muted cursor-not-allowed"
                    : ""
                  }`}
              />
              <div className="h-[20px] flex items-center">
                {errors.bankAccountNumber && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-destructive text-sm">
                      {errors.bankAccountNumber}
                    </span>
                  </div>
                )}
                {!errors.bankAccountNumber &&
                  !formData.bankKeyIFSCCode &&
                  !isBankMandatory &&
                  showWarnings && (
                    <span className="text-xs text-muted-foreground">
                      Please enter IFSC Code first to enable this field
                    </span>
                  )}
              </div>
            </div>

            <div className="space-y-2 mt-0">
              <Label htmlFor="partnerBankType">Partner Bank Type</Label>
              <Input
                id="partnerBankType"
                value={formData.bankKeyIFSCCode ? "0000" : ""}
                placeholder={
                  formData.bankKeyIFSCCode
                    ? "0000 (auto-filled)"
                    : "Auto-fills when IFSC entered"
                }
                readOnly
                tabIndex={205}
                className="h-10 w-full bg-muted focus:ring-0 focus:border-border hover:border-border cursor-default"
              />
              <div className="h-[20px] flex items-center">
                {!formData.bankKeyIFSCCode &&
                  !isBankMandatory &&
                  showWarnings && (
                    <div className="flex items-center gap-2 text-primary text-sm bg-primary/10 px-3 py-2 rounded-md border border-primary/20">
                      <span className="text-primary">💡</span>
                      <span>
                        This field will auto-fill when you enter a valid IFSC
                        Code
                      </span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankDetailsSection;
