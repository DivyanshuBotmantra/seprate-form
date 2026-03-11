import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  Check,
  ChevronsUpDown,
} from "lucide-react";
import {
  createUUIDFolder,
  uploadFile,
  createExecutionLog,
} from "@/services/trigger";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useAuditPeriodStore } from "@/lib/store/audit-period-store";
import { useClientNameStore } from "@/lib/store/client-name-store";

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
    uploadedPaths?: string[];
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

// Currency list with 3-letter codes
const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "INR", name: "Indian Rupee" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "PLN", name: "Polish Zloty" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "ZAR", name: "South African Rand" },
  { code: "KRW", name: "South Korean Won" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "AED", name: "UAE Dirham" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "THB", name: "Thai Baht" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "EGP", name: "Egyptian Pound" },
];

const TriggerPageJudgementalSamplePreparation = ({
  flowTitle = "Judgmental Sample Preparation",
  flowDescription = "Start a new execution for Judgmental Sample Preparation process",
}: TriggerPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [clientType, setClientType] = useState<"sr" | "gl">("sr");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState>({});
  const [fileMetadata, setFileMetadata] = useState<FileUploadMetadata>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [currency, setCurrency] = useState<string>("");
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const { selectedPeriod } = useAuditPeriodStore();
  const { selectedClient } = useClientNameStore();

  // Determine back path from current location
  const getBackPath = () => {
    const pathParts = location.pathname.split("/");
    pathParts.pop(); // Remove 'trigger'
    return pathParts.join("/") || "/dashboard";
  };

  // File upload fields based on client type
  const fileFields = {
    sr: [
      {
        id: "INP-SR-TALLY-CY",
        label: "Sales Register - Tally - Current Year",
        required: true,
      },

      {
        id: "INP-SR-TALLY-NY",
        label: "Sales Register - Tally - Next Year",
        required: true,
      },

      {
        id: "INP-JDG-REV-SAMPLING-INS",
        label: "Sampling Instructions",
        required: true,
      },
    ],
    gl: [
      {
        id: "INP-JDG-REV-SAMPLING-INS",
        label: "Sampling Instructions",
        required: true,
      },
      {
        id: "INP-GL-DETAILS-CY",
        label: "General Ledger Details - Current Year",
        required: true,
      },
    ],
  };

  // Get required fields based on client type
  const currentFields = fileFields[clientType];

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

  // Handle file selection (files are uploaded when execute is clicked)
  const handleFileChange = async (fieldId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Update local file state immediately for UI
    setUploadedFiles((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] || []), ...fileArray],
    }));

    // Set metadata for files (upload will happen on execute)
    setFileMetadata((prev) => ({
      ...prev,
      [fieldId]: {
        ...prev[fieldId],
        files: [...(prev[fieldId]?.files || []), ...fileArray],
        uploadStatus: "idle",
        uploadedPaths: [],
      },
    }));
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
      const updatedPaths =
        metadata.uploadedPaths?.filter((_, index) => index !== fileIndex) || [];

      return {
        ...prev,
        [fieldId]: {
          files: updatedFiles,
          uploadStatus:
            updatedFiles.length === 0 ? "idle" : metadata.uploadStatus,
          uploadedPaths: updatedPaths,
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
      // Step 1: Create UUID folder path
      const uuidPayload = {
        org_name: "CLA-AUDIT",
        bot_name: "Judgemental Sample Preparation",
        bot_category: "Revenue",
      };
      const uuidResult = await createUUIDFolder(uuidPayload);

      if (uuidResult.error || !uuidResult.data) {
        console.error("Error creating UUID folder:", uuidResult.error);
        // TODO: Show error message to user
        setIsExecuting(false);
        return;
      }

      // Extract folder_path from UUID result
      const uuidData = uuidResult.data as any;
      const folderPath = uuidData.response_body.folder_path;
      const folderPayloadLink = uuidData.response_body.folder_link;
      const executionIdPayload = uuidData.response_body?.uuid_folder;
      if (!folderPath) {
        console.error("Error: No folder_path received from UUID creation");
        // TODO: Show error message to user
        setIsExecuting(false);
        return;
      }

      // Step 2: Upload all files and collect folder_link
      let folderLink: string | null = null;
      // Track uploaded files by field for execution log
      const uploadedFilesByField: {
        [fieldId: string]: {
          fileCodeName: string;
          fileDisplayName: string;
          uploadedFiles: Array<{
            file_name: string;
            file_path: string;
          }>;
        };
      } = {};

      // Constants for file upload payload
      const orgName = "CLA-AUDIT";
      const botName = "Judgemental Sample Preparation";
      const botCategory = "Revenue";

      // Upload files for each field
      for (const field of currentFields) {
        const files = uploadedFiles[field.id] || [];
        if (files.length === 0) continue;

        // Get field metadata for file_code_name and file_display_name
        const fieldMetadata = getFieldMetadata(field.id);

        // Initialize field in uploadedFilesByField
        uploadedFilesByField[field.id] = {
          fileCodeName: fieldMetadata.fileCodeName,
          fileDisplayName: fieldMetadata.fileDisplayName,
          uploadedFiles: [],
        };

        // Update upload status for this field
        setFileMetadata((prev) => ({
          ...prev,
          [field.id]: {
            ...prev[field.id],
            uploadStatus: "uploading",
          },
        }));

        // Upload each file
        for (const file of files) {
          try {
            // Convert file to base64
            const fileBase64 = await fileToBase64(file);
            const fileType = getFileType(file.name);

            // Construct upload payload
            const uploadPayload = {
              org_name: orgName,
              bot_name: botName,
              bot_category: botCategory,
              file_name: file.name,
              file_type: fileType,
              file_base64: fileBase64,
              folder_path: folderPath,
            };

            const uploadResult = await uploadFile(uploadPayload);

            if (uploadResult.error) {
              console.error(
                `Error uploading ${file.name}:`,
                uploadResult.error
              );
              setFileMetadata((prev) => ({
                ...prev,
                [field.id]: {
                  ...prev[field.id],
                  uploadStatus: "error",
                },
              }));
              // TODO: Show error message to user
              setIsExecuting(false);
              return;
            }

            // Extract folder_link and file_url from response
            const responseData = uploadResult.data as any;
            const responseBody = responseData?.response_body || responseData;
            if (responseBody?.folder_link && !folderLink) {
              folderLink = responseBody.folder_link;
            }

            // Extract file_url from response
            const fileUrl = responseBody?.file_path;
            const fileName = responseBody?.file_name;
            // Track uploaded file for this field
            uploadedFilesByField[field.id].uploadedFiles.push({
              file_name: fileName,
              //   file_name: file.name,
              file_path: fileUrl,
            });
            console.log(uploadedFilesByField, "uploadedFilesByField");
          } catch (fileError) {
            console.error(`Error processing file ${file.name}:`, fileError);
            setFileMetadata((prev) => ({
              ...prev,
              [field.id]: {
                ...prev[field.id],
                uploadStatus: "error",
              },
            }));
            // TODO: Show error message to user
            setIsExecuting(false);
            return;
          }
        }

        // Update upload status to success
        setFileMetadata((prev) => ({
          ...prev,
          [field.id]: {
            ...prev[field.id],
            uploadStatus: "success",
          },
        }));
      }

      // Convert uploadedFilesByField to input_files array format
      const inputFiles = Object.values(uploadedFilesByField).map(
        (fieldData) => ({
          file_code_name: fieldData.fileCodeName,
          file_display_name: fieldData.fileDisplayName,
          uploaded_files: fieldData.uploadedFiles,
        })
      );

      // if (!folderLink) {
      //   console.error("Error: No folder_link received from upload");
      //   // TODO: Show error message to user
      //   setIsExecuting(false);
      //   return;
      // }

      // Step 3: Create execution log
      // Construct input_param array
      const inputParam = [
        {
          param_code_name: "execution_mode",
          param_display_name: "Execution Mode",
          param_value: clientType.toUpperCase(),
        },
        // {
        //   param_code_name: "output_folder_path",
        //   param_display_name: "Output Folder Path",
        //   param_value: folderPayloadLink,
        // },
      ];

      // Add currency to input_param if selected
      if (currency) {
        inputParam.push({
          param_code_name: "functional_currency",
          param_display_name: "Functional Currency",
          param_value: currency,
        });
      }

      // Extract execution_id from folder_path (UUID at the end) or from UUID response
      const uuidResponseData = uuidResult.data as any;
      const uuidResponseBody =
        uuidResponseData?.response_body || uuidResponseData;
      let executionId =
        uuidResponseBody?.execution_id || uuidResponseBody?.uuid;
      if (!executionId && folderPath) {
        // Extract UUID from folder_path if it's at the end
        const uuidMatch = folderPath.match(
          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        );
        if (uuidMatch) {
          executionId = uuidMatch[0];
        }
      }

      // Construct execution log payload
      const executionLogPayload = {
        execution_id: executionIdPayload,
        bot_name: botName,
        bot_category: botCategory,
        input_param: inputParam,
        input_files: inputFiles,
        db_field1: selectedClient,
        db_field2: selectedPeriod,
        org_name: "CLA-AUDIT",
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
        navigate("/judgmental-sample-preparation");
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
            onClick={() => navigate("/judgmental-sample-preparation")}
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
            <div className="flex flex-wrap gap-4">
              {/* Client Type */}
              <div className="flex flex-1 min-w-[200px] bg-amber-20 items-center gap-4">
                <h1 className="text-lg font-semibold">Execution Mode</h1>
                <RadioGroup
                  value={clientType}
                  onValueChange={(value) => {
                    setClientType(value as "sr" | "gl");
                    setUploadedFiles({}); // Reset files when switching
                    setFileMetadata({}); // Reset metadata when switching
                  }}
                  className="flex flex-row"
                >
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-4/40 hover:bg-chart-4/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="sr"
                      id="execution-sr"
                      className="group-hover:border-chart-1"
                    />
                    <Label
                      htmlFor="execution-sr"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      SR
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border border-border/60 rounded-lg hover:border-chart-4/40 hover:bg-chart-4/5 cursor-pointer transition-all duration-200 group">
                    <RadioGroupItem
                      value="gl"
                      id="execution-gl"
                      className="group-hover:border-chart-2"
                    />
                    <Label
                      htmlFor="execution-gl"
                      className="cursor-pointer flex-1 text-sm group-hover:text-foreground font-light"
                    >
                      GL
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex flex-1 items-center gap-4 min-w-0">
                <h1 className="text-lg font-semibold whitespace-nowrap">
                  Currency
                </h1>
                <Popover open={currencyOpen} onOpenChange={setCurrencyOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={currencyOpen}
                      className="flex-1 min-w-0 justify-between border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                    >
                      <span className="truncate">
                        {currency
                          ? currencies.find((c) => c.code === currency)?.code
                          : "Select currency..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[280px] sm:w-[300px] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Search currency..." />
                      <CommandList>
                        <CommandEmpty>No currency found.</CommandEmpty>
                        <CommandGroup>
                          {currencies.map((curr) => (
                            <CommandItem
                              key={curr.code}
                              value={`${curr.code} ${curr.name}`}
                              onSelect={() => {
                                setCurrency(
                                  curr.code === currency ? "" : curr.code
                                );
                                setCurrencyOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  currency === curr.code
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium">{curr.code}</span>
                                <span className="text-muted-foreground truncate">
                                  {curr.name}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                  Execution Mode:{" "}
                  <strong className="uppercase">{clientType}</strong>
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

export default TriggerPageJudgementalSamplePreparation;
