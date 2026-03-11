import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ChevronLeft,
  Upload,
  X,
  Play,
  File,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { uploadFile, createExecutionLog } from "@/services/trigger";
import { toast } from "sonner";
import { useClientNameStore } from "@/lib/store/client-name-store";
import { useAuditPeriodStore } from "@/lib/store/audit-period-store";

interface TriggerPageProps {
  flowTitle?: string;
  flowDescription?: string;
}

type FileUploadState = {
  [key: string]: File[];
};

type FileUploadMetadata = {
  [key: string]: {
    files: File[];
    uploadStatus: "idle" | "uploading" | "success" | "error";
    uploadedFiles?: Array<{
      file_name: string;
      file_url: string;
    }>;
  };
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Helper function to get file icon based on extension
const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"].includes(
      ext || ""
    )
  ) {
    return <ImageIcon className="w-4 h-4 text-purple-500" />;
  }
  if (["xlsx", "xls", "csv", "pdf", "doc", "docx"].includes(ext || "")) {
    return <FileText className="w-4 h-4 text-blue-500" />;
  }
  return <File className="w-4 h-4 text-muted-foreground" />;
};

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1]; // Remove data:type;base64, prefix
      resolve(base64String);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper function to get file type from extension
const getFileType = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  return ext;
};

const TriggerPage = ({
  flowTitle = "TB vs GL Reconciliation",
  flowDescription = "Start a new execution for TB vs GL Reconciliation process",
}: TriggerPageProps) => {
  const navigate = useNavigate();

  // Form state
  const [clientType, setClientType] = useState<"new" | "existing">("new");
  const [sourceSystem, setSourceSystem] = useState<"tally" | "general">(
    "tally"
  );
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState>({});
  const [fileMetadata, setFileMetadata] = useState<FileUploadMetadata>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const { selectedClient } = useClientNameStore();
  const { selectedPeriod } = useAuditPeriodStore();

  // File upload fields based on client type and source system
  const fileFields = {
    new: {
      tally: [
        {
          id: "INP-TALLY-TB-CY",
          label: "Trial Balance - Current Year",
          required: true,
        },
        {
          id: "INP-TALLY-GL-CY",
          label: "General Ledger - Current Year",
          required: true,
        },
        {
          id: "INP-TALLY-TB-PY",
          label: "Trial Balance - Previous Year",
          required: true,
        },
        {
          id: "INP-LEDGER-CW",
          label: "Grouped Trial Balance",
          required: true,
        },
      ],
      general: [
        {
          id: "INP-GENERAL-TB-CY",
          label: "Trial Balance - Current Year",
          required: true,
        },
        {
          id: "INP-GENERAL-GL-CY",
          label: "General Ledger - Current Year",
          required: true,
        },
        {
          id: "INP-GENERAL-TB-PY",
          label: "Trial Balance - Previous Year",
          required: true,
        },
        {
          id: "INP-LEDGER-CW",
          label: "Grouped Trial Balance",
          required: true,
        },
      ],
    },
    existing: {
      tally: [
        {
          id: "INP-TALLY-TB-CY",
          label: "Trial Balance - Current Year",
          required: true,
        },
        {
          id: "INP-TALLY-GL-CY",
          label: "General Ledger - Current Year",
          required: true,
        },
        {
          id: "INP-TALLY-TB-PY",
          label: "Trial Balance - Previous Year",
          required: true,
        },
        {
          id: "INP-GL-CW-PY",
          label: "CW mapping File - Previous Year",
          required: true,
        },
      ],
      general: [
        {
          id: "INP-GENERAL-TB-CY",
          label: "Trial Balance - Current Year",
          required: true,
        },
        {
          id: "INP-GENERAL-GL-CY",
          label: "General Ledger - Current Year",
          required: true,
        },
        {
          id: "INP-GENERAL-TB-PY",
          label: "Trial Balance - Previous Year",
          required: true,
        },
        {
          id: "INP-GL-CW-PY",
          label: "CW mapping File - Previous Year",
          required: true,
        },
      ],
    },
  };

  // Get required fields based on client type and source system
  const currentFields = fileFields[clientType][sourceSystem];

  // Mapping function to get file_code_name and file_display_name for each field
  const getFieldMetadata = (fieldId: string) => {
    const fieldMapping: {
      [key: string]: { fileCodeName: string; fileDisplayName: string };
    } = {
      // New client type - Tally fields
      tb_current_new_tally: {
        fileCodeName: "INP-TALLY-TB-CY",
        fileDisplayName: "Trial Balance - Current Year",
      },
      gl_current_new_tally: {
        fileCodeName: "INP-TALLY-GL-CY",
        fileDisplayName: "General Ledger - Current Year",
      },
      tb_previous_new_tally: {
        fileCodeName: "INP-TALLY-TB-PY",
        fileDisplayName: "Trial Balance - Previous Year",
      },
      // New client type - General fields
      tb_current_new_general: {
        fileCodeName: "INP-GENERAL-TB-CY",
        fileDisplayName: "Trial Balance - Current Year",
      },
      gl_current_new_general: {
        fileCodeName: "INP-GENERAL-GL-CY",
        fileDisplayName: "General Ledger - Current Year",
      },
      tb_previous_new_general: {
        fileCodeName: "INP-GENERAL-TB-PY",
        fileDisplayName: "Trial Balance - Previous Year",
      },
      "INP-LEDGER-CW": {
        fileCodeName: "INP-LEDGER-CW",
        fileDisplayName: "Grouped Trial Balance",
      },
      // Existing client type - Tally fields (already using file code names as IDs)
      "INP-TALLY-TB-CY": {
        fileCodeName: "INP-TALLY-TB-CY",
        fileDisplayName: "Trial Balance - Current Year",
      },
      "INP-TALLY-GL-CY": {
        fileCodeName: "INP-TALLY-GL-CY",
        fileDisplayName: "General Ledger - Current Year",
      },
      "INP-TALLY-TB-PY": {
        fileCodeName: "INP-TALLY-TB-PY",
        fileDisplayName: "Trial Balance - Previous Year",
      },
      // Existing client type - General fields
      "INP-GENERAL-TB-CY": {
        fileCodeName: "INP-GENERAL-TB-CY",
        fileDisplayName: "Trial Balance - Current Year",
      },
      "INP-GENERAL-GL-CY": {
        fileCodeName: "INP-GENERAL-GL-CY",
        fileDisplayName: "General Ledger - Current Year",
      },
      "INP-GENERAL-TB-PY": {
        fileCodeName: "INP-GENERAL-TB-PY",
        fileDisplayName: "Trial Balance - Previous Year",
      },
      "INP-GL-CW-PY": {
        fileCodeName: "INP-GL-CW-PY",
        fileDisplayName: "CW mapping File - Previous Year",
      },
    };
    return (
      fieldMapping[fieldId] || {
        fileCodeName: fieldId,
        fileDisplayName: fieldId,
      }
    );
  };

  // Handle file selection and upload immediately
  const handleFileChange = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Update local file state immediately for UI
    setUploadedFiles((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...fileArray],
    }));

    // Set metadata for files and mark as uploading
    setFileMetadata((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        files: [...(prev[fieldId]?.files || []), ...fileArray],
        uploadStatus: "uploading",
        uploadedFiles: prev[fieldId]?.uploadedFiles || [],
      },
    }));

    try {
      const orgName = "CLA-AUDIT";
      const uploadedFilesInfo: Array<{ file_name: string; file_url: string }> =
        [];

      // Upload each file immediately
      for (const file of fileArray) {
        try {
          // Convert file to base64
          const fileBase64 = await fileToBase64(file);
          const fileType = getFileType(file.name);

          // Construct upload payload with simplified structure
          const uploadPayload = {
            org_name: orgName,
            file_name: file.name,
            file_type: fileType,
            file_base64: fileBase64,
          };

          const uploadResult = await uploadFile(uploadPayload);

          if (uploadResult.error) {
            console.error(`Error uploading ${file.name}:`, uploadResult.error);
            toast.error(`Failed to upload ${file.name}`);
            setFileMetadata((prev) => ({
              ...prev,
              [fieldId]: {
                ...prev[fieldId],
                uploadStatus: "error",
              },
            }));
            return;
          }

          // Extract file_url from response
          const responseData = uploadResult.data as any;
          const responseBody = responseData?.response_body || responseData;
          const fileUrl = responseBody?.file_url;
          const fileName = responseBody?.file_name || file.name;

          uploadedFilesInfo.push({
            file_name: fileName,
            file_url: fileUrl,
          });
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          toast.error(`Failed to process ${file.name}`);
          setFileMetadata((prev) => ({
            ...prev,
            [fieldId]: {
              ...prev[fieldId],
              uploadStatus: "error",
            },
          }));
          return;
        }
      }

      // Update metadata with uploaded files info
      setFileMetadata((prev) => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          uploadStatus: "success",
          uploadedFiles: [
            ...(prev[fieldId]?.uploadedFiles || []),
            ...uploadedFilesInfo,
          ],
        },
      }));

      toast.success(
        `Successfully uploaded ${fileArray.length} file${
          fileArray.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error during file upload:", error);
      toast.error("Failed to upload files");
      setFileMetadata((prev) => ({
        ...prev,
        [fieldId]: {
          ...prev[fieldId],
          uploadStatus: "error",
        },
      }));
    }
  };

  // Remove uploaded file
  const removeFile = (fieldId: string, fileIndex: number) => {
    setUploadedFiles((prev) => {
      const fieldFiles = prev[fieldId] || [];
      const updatedFiles = fieldFiles.filter((_, index) => index !== fileIndex);
      return {
        ...prev,
        [fieldId]: updatedFiles,
      };
    });

    setFileMetadata((prev) => {
      const metadata = prev[fieldId];
      if (!metadata) return prev;

      const updatedFiles = metadata.files.filter(
        (_, index) => index !== fileIndex
      );
      const updatedUploadedFiles =
        metadata.uploadedFiles?.filter((_, index) => index !== fileIndex) || [];

      return {
        ...prev,
        [fieldId]: {
          files: updatedFiles,
          uploadStatus:
            updatedFiles.length === 0 ? "idle" : metadata.uploadStatus,
          uploadedFiles: updatedUploadedFiles,
        },
      };
    });
  };

  // Clear all files for a field
  const clearAllFiles = (fieldId: string) => {
    setUploadedFiles((prev) => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });

    setFileMetadata((prev) => {
      const updated = { ...prev };
      delete updated[fieldId];
      return updated;
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(fieldId, files);
    }
  };

  // Handle form submission and execute workflow
  const handleExecute = async () => {
    // Validate required fields have files
    const hasAllRequiredFiles = currentFields.every((field) => {
      if (field.required) {
        const files = uploadedFiles[field.id] || [];
        return files.length > 0;
      }
      return true;
    });

    if (!hasAllRequiredFiles) {
      // TODO: Show error message to user
      console.error("Please upload all required files");
      return;
    }

    setIsExecuting(true);

    try {
      // Constants for execution log payload
      const orgName = "Botmantra";
      const botName = "TB vs GL Reconciliation";
      const botCategory = "TB vs GL";

      // Build uploaded files by field from metadata
      const uploadedFilesByField: {
        [fieldId: string]: {
          fileCodeName: string;
          fileDisplayName: string;
          uploadedFiles: Array<{
            file_name: string;
            file_url: string;
          }>;
        };
      } = {};

      // Collect uploaded files from metadata for each field
      for (const field of currentFields) {
        const fieldMetadata = getFieldMetadata(field.id);
        const metadata = fileMetadata[field.id];

        uploadedFilesByField[field.id] = {
          fileCodeName: fieldMetadata.fileCodeName,
          fileDisplayName: fieldMetadata.fileDisplayName,
          uploadedFiles: metadata?.uploadedFiles || [],
        };
      }

      // Convert uploadedFilesByField to input_files array format
      const inputFiles = Object.values(uploadedFilesByField).map(
        (fieldData) => ({
          file_code_name: fieldData.fileCodeName,
          file_display_name: fieldData.fileDisplayName,
          uploaded_files: fieldData.uploadedFiles.map((file) => ({
            file_name: file.file_name,
            file_url: file.file_url,
          })),
        })
      );

      // Construct input_param array
      const inputParam = [
        {
          param_code_name: "client_type",
          param_display_name: "Client Type",
          param_value: clientType.toUpperCase(),
        },
        {
          param_code_name: "source_system",
          param_display_name: "Source System",
          param_value: sourceSystem.toUpperCase(),
        },
      ];

      // Construct execution log payload
      const executionLogPayload = {
        bot_name: botName,
        bot_category: botCategory,
        input_param: inputParam,
        input_files: inputFiles,
        input_json: [{}],
        org_name: orgName,
      };

      const executionLogResult = await createExecutionLog(executionLogPayload);

      if (executionLogResult.error) {
        console.error(
          "Error creating execution log:",
          executionLogResult.error
        );
        // TODO: Show error message to user
      } else {
        toast.success("Execution log created successfully");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error during execution:", error);
      // TODO: Show error message to user
    } finally {
      setIsExecuting(false);
    }
  };

  // File upload component with drag and drop
  const FileUploadField = ({ field }: { field: (typeof currentFields)[0] }) => {
    const files = uploadedFiles[field.id] || [];
    const hasFiles = files.length > 0;
    const isRequired = field.required;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.id} className="text-base font-medium">
            {field.label}{" "}
            {isRequired && <span className="text-destructive">*</span>}
          </Label>
          {hasFiles && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => clearAllFiles(field.id)}
              className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Trash2 className="w-3 h-3 mr-1.5" />
              Clear All
            </Button>
          )}
        </div>
        {/* Drag and Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, field.id)}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (!target.closest("button") && !target.closest(".file-item")) {
              document.getElementById(field.id)?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
            hasFiles
              ? "border-primary/40 bg-gradient-to-br from-primary/8 via-primary/5 to-primary/3 cursor-pointer shadow-sm"
              : "border-border/40 bg-gradient-to-br from-muted/40 via-muted/30 to-muted/20 hover:border-primary/40 hover:from-primary/10 hover:via-primary/5 hover:to-primary/3 cursor-pointer hover:shadow-sm"
          }`}
        >
          <input
            id={field.id}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(field.id, e.target.files)}
            accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico"
          />
          {!hasFiles ? (
            <div className="flex flex-col items-center justify-center gap-3 py-6 px-4 pointer-events-none">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/10 p-4 ring-4 ring-primary/5">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop files here or <span className="">click to browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supports: Documents (.xlsx, .xls, .csv, .pdf) and Images
                  (.png, .jpg, .jpeg, .gif, .webp)
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-status-success-light p-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {files.length} file{files.length > 1 ? "s" : ""} uploaded
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(field.id)?.click();
                  }}
                  className="h-7 text-xs border-primary/20 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  Add More
                </Button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="file-item flex items-center gap-3 p-3 bg-background/80 border border-border/60 rounded-lg hover:bg-accent/50 hover:border-primary/20 transition-all duration-200 group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="shrink-0 group-hover:scale-110 transition-transform">
                      {getFileIcon(file.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(field.id, index);
                      }}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {/* Validation feedback */}
        {isRequired && !hasFiles && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {/* Validation message placeholder */}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full pb-24 ">
      {/* Form Card */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/50 pb-3">
        <div className="flex items-center  rounded-t-lg p-2 gap-4 border-b border-border/50 bg-primary">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            size="sm"
            className="gap-2 hover:bg-white/10 transition-colors text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              {/* <div className="h-1 w-1 rounded-full bg-primary animate-pulse" /> */}
              <h1 className="text-2xl font-bold tracking-tight text-[#ffffff]">
                {flowTitle}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">{flowDescription}</p>
          </div>
        </div>

        <div className="px-6">
          <div className="space-y-6">
            {/* Selection Parameters */}
            <div className="flex">
              {/* Client Type */}
              <div className=" flex flex-1 bg-amber-20 items-center gap-4">
                <h1 className="text-lg font-semibold">Client Type</h1>
                <RadioGroup
                  value={clientType}
                  onValueChange={(value) => {
                    setClientType(value as "new" | "existing");
                    setUploadedFiles({}); // Reset files when switching
                    setFileMetadata({}); // Reset metadata when switching
                  }}
                  className="flex flex-row"
                >
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-4/40 hover:bg-chart-4/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="new"
                      id="new"
                      className="group-hover:border-chart-1"
                    />
                    <Label
                      htmlFor="new"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      New
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-4/40 hover:bg-chart-4/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="existing"
                      id="existing"
                      className="group-hover:border-chart-2"
                    />
                    <Label
                      htmlFor="existing"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      Existing
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Source System */}
              <div className="flex flex-1 bg-amber-20 items-center gap-4">
                <h1 className="text-lg font-semibold">Source System</h1>
                <RadioGroup
                  value={sourceSystem}
                  onValueChange={(value) => {
                    setSourceSystem(value as "tally" | "general");
                    setUploadedFiles({}); // Reset files when switching
                    setFileMetadata({}); // Reset metadata when switching
                  }}
                  className="flex"
                >
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-3/40 hover:bg-chart-3/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="tally"
                      id="tally"
                      className="group-hover:border-chart-3"
                    />
                    <Label
                      htmlFor="tally"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      Tally
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-4/40 hover:bg-chart-4/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="general"
                      id="general"
                      className="group-hover:border-chart-4"
                    />
                    <Label
                      htmlFor="general"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      General
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* File Upload Section */}
            <div className=" border-t border-border/50 space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">File Uploads</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Upload required files for processing
                  </p>
                </div>
                <span className="text-xs font-medium bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20 px-3 py-1.5 rounded-full">
                  Client Type:{" "}
                  <strong className="capitalize">{clientType}</strong> | Source
                  System: <strong className="capitalize">{sourceSystem}</strong>
                </span>
              </div>

              {/* File Upload Fields */}
              <div className="grid grid-cols-2 gap-4">
                {currentFields.map((field) => (
                  <FileUploadField key={field.id} field={field} />
                ))}
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between  border-t border-border/50 pt-3">
              <div className="text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="rounded-full bg-status-pending-light p-1">
                    <AlertCircle className="w-3.5 h-3.5 text-status-pending" />
                  </div>
                  <span>Ready to execute</span>
                </div>
              </div>
              <Button
                size="default"
                onClick={handleExecute}
                disabled={isExecuting}
                className="gap-2 min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TriggerPage;
