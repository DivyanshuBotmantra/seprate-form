import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Image, File, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploadProvider } from "@/contexts/FileUploadContext";
import { toast } from "sonner";

// Import vendor components for display
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
import type {
  VendorFormData,
  LOVData,
  VendorFormErrors,
} from "@/components/vendor";

interface FormViewModeProps {
  vendorData: VendorFormData;
  lovData: LOVData | null;
  transactionId: string;
  formStatus: string;
  createdBy: string;
  createdOn: string;
  updatedBy?: string;
  updatedOn?: string;
  submittedBy?: string;
  submittedOn?: string;
}

type AttachmentData =
  | {
    file_name?: string | null;
    file_url?: string | null;
    url?: string | null;
    name?: string | null;
  }
  | string
  | null
  | undefined;

const FormViewMode: React.FC<FormViewModeProps> = ({
  vendorData,
  lovData,
  transactionId,
  formStatus,
  createdBy,
  createdOn,
  submittedBy,
  submittedOn,
}) => {
  const navigate = useNavigate();
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );

  const handleBack = () => {
    navigate(-1);
  };
  console.log(vendorData, "vendor data");

  // Helper function to get file name from file data (handles both File and UploadedFile types)
  const getFileName = (fileData: AttachmentData): string => {
    if (!fileData || typeof fileData !== "object") {
      return "document.pdf";
    }
    return fileData.file_name || fileData.name || "document.pdf";
  };

  // Helper function to check if file data is valid (has actual file content)
  const isValidFileData = (fileData: AttachmentData): boolean => {
    if (!fileData || typeof fileData !== "object") {
      return false;
    }

    // Check if it has file_name and file_url (API format)
    if (
      fileData.file_name &&
      fileData.file_url &&
      fileData.file_name.trim() !== "" &&
      fileData.file_url.trim() !== ""
    ) {
      return true;
    }

    // Check if it has name (native File object)
    if (fileData.name && fileData.name.trim() !== "") {
      return true;
    }

    return false;
  };

  // Helper function to get file icon based on file type
  const getFileIcon = (fileName: string | undefined | null) => {
    if (!fileName || typeof fileName !== "string") {
      return <File className="h-4 w-4" />;
    }

    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return <Image className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  // Download individual file attachment
  const handleDownloadFile = async (
    fileKey: string,
    fileData: AttachmentData
  ) => {
    if (!fileData) {
      toast.error("File data not available");
      return;
    }

    const fileName = getFileName(fileData);
    const fileUrl =
      typeof fileData === "object"
        ? fileData.file_url || fileData.url
        : fileData;

    if (!fileUrl) {
      toast.error("File URL not available");
      return;
    }

    setDownloadingFiles((prev) => new Set(prev).add(fileKey));

    try {
      // Download directly from the file_url
      const a = document.createElement("a");
      a.href = fileUrl;
      a.download = fileName;
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast.success(`File "${fileName}" downloaded successfully`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        `Failed to download file "${fileName}": ${error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  // Mock handlers for read-only mode
  const mockHandleInputChange = () => {
    // No-op for read-only mode
  };

  const mockHandleSaveSection = async () => {
    // No-op for read-only mode
  };

  const mockErrors: VendorFormErrors = {};

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "submitted":
        return "default";
      case "draft":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "outline";
    }
  };

  // File attachment configuration
  const fileAttachments = [
    {
      key: "gstin",
      label: "GSTIN Document",
      data: vendorData.taxNumber3GSTINFile,
      fileKey: "taxNumber3GSTINFile",
    },
    {
      key: "pan",
      label: "PAN Document",
      data: vendorData.panNumberFile,
      fileKey: "panNumberFile",
    },
    {
      key: "msme",
      label: "MSME Document",
      data: vendorData.creditInformationNumberMSMEFile,
      fileKey: "creditInformationNumberMSMEFile",
    },
    {
      key: "cin",
      label: "CIN Document",
      data: vendorData.cinNumberFile,
      fileKey: "cinNumberFile",
    },
    {
      key: "bank",
      label: "Bank Details Document",
      data: vendorData.bankKeyIFSCCodeFile,
      fileKey: "bankKeyIFSCCodeFile",
    },
    {
      key: "pan_aadhar_linkage",
      label: "PAN Aadhar Linkage Document",
      data: vendorData.panAadharLinkedStatusFile,
      fileKey: "panAadharLinkedStatusFile",
    },
  ].filter((attachment) => isValidFileData(attachment.data)); // Only show attachments with valid file data

  // Render individual file attachment
  const renderFileAttachment = (attachment: (typeof fileAttachments)[0]) => {
    const fileName = getFileName(attachment.data);
    const isDownloading = downloadingFiles.has(attachment.key);

    return (
      <div
        key={attachment.key}
        className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm transition hover:border-primary/50 hover:bg-card/60"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary group-hover:bg-primary/20">
            {getFileIcon(fileName)}
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="text-sm font-semibold text-foreground">
              {attachment.label}
            </p>
            <p className="line-clamp-2 text-xs text-muted-foreground">
              {fileName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => handleDownloadFile(attachment.key, attachment.data)}
            disabled={isDownloading}
          >
            <Download className="h-3 w-3" />
            {isDownloading ? "Downloading…" : "Download"}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <FileUploadProvider>
      <div
        data-view-mode
        className="form-view-mode h-screen bg-sidebar rounded-lg border border-border overflow-hidden shadow-sm flex flex-col"
      >
        {/* Header */}
        <div className="bg-primary border-b border-border px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                onClick={handleBack}
                className="text-muted hover:cursor-pointer"
              >
                <ChevronLeft className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-muted">
                  VENDOR ONBOARDING FORM - VIEW MODE
                </h1>
                <p className="text-sm">
                  <span className="text-muted">Transaction ID:</span>{" "}
                  <span className="text-muted">{transactionId}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Status and Metadata */}
        <div className="bg-muted border-b border-border px-6 py-3 flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            {/* === Left Section: Status === */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                Status:
              </span>
              <Badge
                variant={getStatusBadgeVariant(formStatus)}
                className="bg-success text-white"
              >
                {formStatus}
              </Badge>
            </div>

            {/* === Right Section: Submission Metadata === */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {submittedBy && submittedOn ? (
                <>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>{" "}
                    <span className="text-foreground">
                      {new Date(submittedOn).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      By:
                    </span>{" "}
                    <span className="text-foreground">{submittedBy}</span>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="font-medium text-muted-foreground">
                      Created:
                    </span>{" "}
                    <span className="font-bold text-foreground">
                      {new Date(createdOn).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className=" text-muted-foreground">By:</span>{" "}
                    <span className="text-foreground">{createdBy}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto bg-muted custom-scrollbar">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Read-only notice */}

              {/* Type of Vendor Section */}
              <TypeOfVendorSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
              />

              {/* Vendor Details Section */}
              <VendorDetailsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
                hasStep1Data={false}
              />

              {/* Key Details Section */}
              <KeyDetailsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
                hasStep1Data={false}
              />

              {/* Address Details Section */}
              <AddressDetailsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
              />

              {/* Bank Details Section */}
              <BankDetailsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
              />

              {/* Internal Details Section */}
              <InternalDetailsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
              />

              {/* System Fields Section */}
              <SystemFieldsSection
                formData={vendorData}
                setFormData={() => { }} // No-op for read-only
                errors={mockErrors}
                lovData={lovData}
                handleInputChange={mockHandleInputChange}
                handleSaveSection={mockHandleSaveSection}
                isSaving={false}
                isReadOnly={true}
                editMode={false}
              />

              {/* File Attachments Section */}
              {fileAttachments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      File Attachments ({fileAttachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fileAttachments.map(renderFileAttachment)}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </FileUploadProvider>
  );
};

export default FormViewMode;
