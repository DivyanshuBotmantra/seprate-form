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
} from "lucide-react";
import {
  createUUIDFolder,
  uploadFile,
  createExecutionLog,
} from "@/services/trigger";
import { toast } from "sonner";
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

const Trigger3rdPage = ({
  flowTitle = "System Sampling",
  flowDescription = "Start a new execution for System Sampling process",
}: TriggerPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [uploadedFiles, setUploadedFiles] = useState<FileUploadState>({});
  const [fileMetadata, setFileMetadata] = useState<FileUploadMetadata>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const { selectedPeriod } = useAuditPeriodStore();
  const { selectedClient } = useClientNameStore();
  // Determine back path from current location
  const getBackPath = () => {
    const pathParts = location.pathname.split("/");
    pathParts.pop(); // Remove 'trigger'
    return pathParts.join("/") || "/dashboard";
  };

  // File upload fields based on client type and source system
  const fileFields = [
    {
      id: "INP-SR-TALLY-CY",
      label: "Sales Register - Current Year",
      required: true,
    },
  ];

  // Get required fields based on client type and source system
  const currentFields = fileFields;

  // Mapping function to get file_code_name and file_display_name for each field
  const getFieldMetadata = (fieldId: string) => {
    const fieldMapping = {
      "INP-SR-TALLY-CY": {
        fileCodeName: "INP-SR-TALLY-CY",
        fileDisplayName: "Sales Register - Current Year",
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
        bot_name: "System Sampling",
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
      const botName = "System Sampling";
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

            // Extract folder_link and file_path from response
            const responseData = uploadResult.data as any;
            const responseBody = responseData?.response_body || responseData;
            if (responseBody?.folder_link && !folderLink) {
              folderLink = responseBody.folder_link;
            }

            // Extract file_path from response
            const fileUrl = responseBody?.file_path;
            const fileName = responseBody?.file_name;
            // Track uploaded file for this field
            uploadedFilesByField[field.id].uploadedFiles.push({
              file_name: fileName,
              file_path: fileUrl,
              //   file_name: file.name,
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

      // Construct input_param array
      const inputParam = [
        {
          param_code_name: "inherent_risk",
          param_display_name: "Inherent Risk",
          param_value: inherentRisk,
        },
        {
          param_code_name: "control_risk",
          param_display_name: "Control Risk",
          param_value: controlRisk,
        },
        {
          param_code_name: "risk_of_fraud",
          param_display_name: "Is there risk of fraud",
          param_value: fraudRisk,
        },
        {
          param_code_name: "significant_risk",
          param_display_name: "Is this a significant risk",
          param_value: significantRisk,
        },
        {
          param_code_name: "substantive_procedures",
          param_display_name:
            "Planned Reliance on Assurance from other Substantive Procedures",
          param_value: plannedReliance,
        },
        {
          param_code_name: "nature_of_entity",
          param_display_name: "Nature of Entity",
          param_value: natureOfEntity,
        },
        {
          param_code_name: "population",
          param_display_name: "Population",
          param_value: population,
        },
        {
          param_code_name: "tolerable_error",
          param_display_name: "Tolerable Error",
          param_value: tolerableError,
        },
        {
          param_code_name: "sample_selection_method",
          param_display_name: "Sample Selection Method",
          param_value: sampleMethod,
        },
      ];

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
        navigate("/System Sampling");
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

  const [inherentRisk, setInherentRisk] = useState("Moderate");
  const [controlRisk, setControlRisk] = useState("Moderate");
  const [fraudRisk, setFraudRisk] = useState("Yes");
  const [significantRisk, setSignificantRisk] = useState("Yes");
  const [plannedReliance, setPlannedReliance] = useState("Moderate");

  // Step 2 states
  const [natureOfEntity, setNatureOfEntity] = useState("PIE");
  const [population, setPopulation] = useState("");
  const [tolerableError, setTolerableError] = useState("");

  // Step 3 states
  const [sampleMethod, setSampleMethod] = useState("random");

  return (
    <div className="h-full w-full pb-24">
      {/* Form Card */}
      <div className="flex flex-col gap-3 rounded-lg border border-border/50 pb-3">
        {/* HEADER */}
        <div className="flex items-center rounded-t-lg p-2 gap-4 border-b border-border/50 bg-primary">
          <Button
            variant="ghost"
            onClick={() => navigate("/System Sampling")}
            size="sm"
            className="gap-2 hover:bg-primary-foreground/10 transition-colors text-primary-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-primary-foreground">
                {flowTitle}
              </h1>
            </div>
            <p className="text-sm text-primary-foreground/80">
              {flowDescription}
            </p>
          </div>
        </div>

        {/* BODY */}
        <div className="px-6">
          <div className="space-y-6">
            {/* FORM 2×2 GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4">
              {/* STEP 1 */}
              <div className="border border-border rounded-xl p-4 bg-card shadow space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 1 - Risk Assessment
                </h2>

                <div className="space-y-3">
                  {/* Inherent Risk */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Inherent Risk
                    </Label>
                    <RadioGroup
                      value={inherentRisk}
                      onValueChange={setInherentRisk}
                      className="flex gap-2 mt-0.5"
                    >
                      {["low", "Moderate", "high"].map((v) => (
                        <label
                          key={v}
                          className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                        >
                          <RadioGroupItem value={v} />
                          <span className="text-foreground">{v}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Control Risk */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Control Risk
                    </Label>
                    <RadioGroup
                      value={controlRisk}
                      onValueChange={setControlRisk}
                      className="flex gap-2 mt-0.5"
                    >
                      {["low", "Moderate", "high"].map((v) => (
                        <label
                          key={v}
                          className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                        >
                          <RadioGroupItem value={v} />
                          <span className="text-foreground">{v}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* FRAUD + SIGNIFICANT */}
                  <div className="flex flex-row gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium text-foreground">
                        Is there risk of fraud?
                      </Label>
                      <RadioGroup
                        value={fraudRisk}
                        onValueChange={setFraudRisk}
                        className="flex gap-2 mt-0.5"
                      >
                        {["Yes", "No"].map((v) => (
                          <label
                            key={v}
                            className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                          >
                            <RadioGroupItem value={v} />
                            <span className="text-foreground">{v}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="flex-1">
                      <Label className="text-sm font-medium text-foreground">
                        Is this a significant risk?
                      </Label>
                      <RadioGroup
                        value={significantRisk}
                        onValueChange={setSignificantRisk}
                        className="flex gap-2 mt-0.5"
                      >
                        {["Yes", "No"].map((v) => (
                          <label
                            key={v}
                            className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                          >
                            <RadioGroupItem value={v} />
                            <span className="text-foreground">{v}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Planned Reliance */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Planned Reliance on Assurance
                    </Label>
                    <RadioGroup
                      value={plannedReliance}
                      onValueChange={setPlannedReliance}
                      className="flex gap-2 mt-0.5"
                    >
                      {["low", "Moderate", "high"].map((v) => (
                        <label
                          key={v}
                          className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                        >
                          <RadioGroupItem value={v} />
                          <span className="text-foreground">{v}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* STEP 2 */}
              <div className="border border-border rounded-xl p-4 bg-card shadow space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 2 - Sample Size Identification
                </h2>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">
                    Nature of Entity
                  </Label>
                  <RadioGroup
                    value={natureOfEntity}
                    onValueChange={setNatureOfEntity}
                    className="flex gap-2 mt-0.5"
                  >
                    {["PIE", "Less Complex", "Other"].map((v) => (
                      <label
                        key={v}
                        className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                      >
                        <RadioGroupItem value={v} />
                        <span className="text-foreground">{v}</span>
                      </label>
                    ))}
                  </RadioGroup>

                  {/* Fields */}
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Population (0–100)
                    </Label>
                    <input
                      type="number"
                      className="border border-border rounded-md p-2 w-full mt-0.5 bg-background text-foreground"
                      value={population}
                      placeholder="Enter Population"
                      onChange={(e) => setPopulation(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Tolerable Error (0–100)
                    </Label>
                    <input
                      type="number"
                      className="border border-border rounded-md p-2 w-full mt-0.5 bg-background text-foreground"
                      value={tolerableError}
                      placeholder="Enter Tolerable Error"
                      onChange={(e) => setTolerableError(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* STEP 3 */}
              <div className="border border-border rounded-xl p-4 bg-card shadow space-y-3">
                <h2 className="text-lg font-semibold text-foreground">
                  Step 3 - Sampling
                </h2>
                <Label className="text-sm font-medium text-foreground">
                  Sample Selection Method
                </Label>
                <RadioGroup
                  value={sampleMethod}
                  onValueChange={setSampleMethod}
                  className="flex gap-2 mt-0.5"
                >
                  {["random", "MUS"].map((v) => (
                    <label
                      key={v}
                      className="flex items-center gap-2 border border-border rounded-md px-2.5 py-1 cursor-pointer hover:bg-muted"
                    >
                      <RadioGroupItem value={v} />
                      <span className="text-foreground">{v}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* STEP 4: File Upload */}
              <div className="border-t border-border/50 space-y-3 pt-2 ">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">File Uploads</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Upload required files for processing
                    </p>
                  </div>
                </div>

                {/* File Upload Fields */}
                <div className="">
                  {currentFields.map((field) => (
                    <FileUploadField key={field.id} field={field} />
                  ))}
                </div>
              </div>
            </div>

            {/* Execute Button */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <div className="text-sm flex items-center gap-2 text-muted-foreground">
                <div className="rounded-full bg-status-pending-light p-1">
                  <AlertCircle className="w-3.5 h-3.5 text-status-pending" />
                </div>
                Ready to execute
              </div>

              <Button
                size="default"
                onClick={handleExecute}
                disabled={isExecuting}
                className="gap-2 min-w-[140px] bg-primary hover:bg-primary/90 text-primary-foreground shadow hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
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

export default Trigger3rdPage;
