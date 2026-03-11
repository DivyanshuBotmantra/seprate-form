import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  EyeIcon,
  Calendar,
  FileText,
  File,
  Clock,
  XCircle,
  CheckCircle2,
  Loader2,
  Copy,
  Bot,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { downloadFile } from "@/services/download";
import { useOrgStore } from "@/lib/store/org-store";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TbReconViewSheetProps {
  data: any;
  bot_name: string;
  open: boolean;
  executionId: string;
  onOpenChange: (open: boolean) => void;
}

interface OutputFile {
  file_code_name?: string;
  file_display_name: string;
  file_category?: string;
  bot_totalInputcount?: number;
  bot_passcount?: number;
  bot_failcount?: number;
  uploaded_files?: Array<{
    file_name: string;
    file_path: string;
    file_url?: string;
  }>;
  files?: Array<{
    file_name: string;
    file_path: string;
    file_url?: string;
  }>;
}

interface OutputFilesObject {
  [key: string]: {
    file_display_name: string;
    file_category?: string;
    bot_totalInputcount?: number;
    bot_passcount?: number;
    bot_failcount?: number;
    uploaded_files?: Array<{
      file_name: string;
      file_path: string;
      file_url?: string;
    }>;
    files?: Array<{
      file_name: string;
      file_path: string;
      file_url?: string;
    }>;
  };
}

const TbReconViewSheet = ({ data, bot_name, open, executionId, onOpenChange }: TbReconViewSheetProps) => {
  const [downloadingFiles, setDownloadingFiles] = useState<Set<string>>(
    new Set()
  );
  const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);

  // Helper to safely parse stringified dictionaries (often returned by some backends)
  const safeParse = (val: any) => {
    if (typeof val !== "string") return val;
    if (!val || val === "null" || val === "None") return null;

    try {
      // Try standard JSON parse first
      return JSON.parse(val);
    } catch (e) {
      try {
        // Fallback: Handle Python-style single quoted strings
        // Standardize: ' -> ", None -> null
        const formatted = val
          .replace(/'/g, '"')
          .replace(/None/g, "null")
          .replace(/True/g, "true")
          .replace(/False/g, "false");
        return JSON.parse(formatted);
      } catch (err) {
        console.error("Failed to parse data field:", val, err);
        return null;
      }
    }
  };

  const processedData = useState(() => ({
    ...data,
    input_data: safeParse(data?.input_data),
    output_data: safeParse(data?.output_data),
  }))[0];

  const handleDownload = async (
    filePath: string,
    fileName: string,
    fileUrl?: string
  ) => {
    const fileKey = `${filePath}-${fileName}`;

    try {
      setDownloadingFiles((prev) => new Set(prev).add(fileKey));

      // Use file_url if available, otherwise use file_path
      const file_path = fileUrl || filePath;
      const file_name = fileName;

      if (!file_name || !file_path) {
        toast.error("File information is missing");
        setDownloadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fileKey);
          return newSet;
        });
        return;
      }

      const payload = {
        org_name: selectedOrg,
        file_name: file_name, //required
        file_url: file_path, //required
        bot_code: processedData?.bot_code,
      };
      const res = await downloadFile(payload);
      const base64Data = res?.data?.response_body?.file_base64;

      if (base64Data) {
        // Convert base64 to blob and download
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/octet-stream",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = file_name || "download";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Downloading ${file_name || "file"}...`);
      } else {
        toast.error("File data not available");
      }
    } catch (err) {
      console.error("Download file error:", err);
      toast.error("Failed to download file");
    } finally {
      setDownloadingFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fileKey);
        return newSet;
      });
    }
  };

  const handleCopyExecutionId = async () => {
    if (!processedData?.bot_execution_id) {
      toast.error("Execution ID not available");
      return;
    }

    try {
      await navigator.clipboard.writeText(processedData.bot_execution_id);
      toast.success("Execution ID copied to clipboard");
    } catch (err) {
      console.error("Copy to clipboard error:", err);
      toast.error("Failed to copy Execution ID");
    }
  };

  const formatDateTimeForSheet = (dateString: string | null | undefined) => {
    if (!dateString) return "Not available";
    return formatDateTime(String(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase().replace(/-/g, "") || "";
    let colorClass = "bg-amber-500/70 border-amber-500 text-white dark:text-white";
    let icon = <Loader2 className="w-3.5 h-3.5 animate-spin" />;

    if (statusLower === "succeeded" || statusLower === "success" || statusLower === "completed" || statusLower === "submitted") {
      colorClass = "bg-success/70 border-success text-white dark:text-white";
      icon = <CheckCircle2 className="w-3.5 h-3.5" />;
    } else if (statusLower === "failed" || statusLower === "error" || statusLower === "rejected") {
      colorClass = "bg-danger/70 border-danger text-white dark:text-white";
      icon = <XCircle className="w-3.5 h-3.5" />;
    } else if (statusLower === "initiated") {
      colorClass = "bg-[#3B82F6]/70 border-[#3B82F6] text-white dark:text-white";
      icon = <Loader2 className="w-3.5 h-3.5" />;
    }

    return (
      <Badge
        variant="outline"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 font-bold tracking-tight rounded-full border transition-all shadow-sm",
          colorClass
        )}
      >
        {icon}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const renderField = (
    label: string,
    value: any,
    icon?: React.ReactNode,
    formatter?: (val: any) => React.ReactNode
  ) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    return (
      <div className="flex items-start space-x-4 p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
        {icon && (
          <div className="shrink-0 p-2 rounded-lg bg-primary/5 text-primary/70">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-70">
            {label}
          </p>
          <div className="text-[14px] font-semibold text-foreground leading-relaxed">
            {formatter ? formatter(value) : String(value)}
          </div>
        </div>
      </div>
    );
  };

  const formatFieldName = (key: string): string => {
    // Convert snake_case to Title Case
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const renderInputDataFields = (inputData: any) => {
    if (!inputData || typeof inputData !== "object") {
      return null;
    }

    // Get all keys except 'input_files'
    const otherFields = Object.entries(inputData).filter(
      ([key]) => key !== "input_files"
    );

    if (otherFields.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3 pt-4">
        <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
          <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
          Input Data
        </h3>
        {otherFields.map(([key, value]) => {
          // Skip null, undefined, or empty values
          if (value === null || value === undefined || value === "") {
            return null;
          }

          // Format the field name
          const displayName = formatFieldName(key);

          // Special handling for input_params
          if (key === "input_params" || key === "input-params") {
            // Check if value is an array of param objects
            if (Array.isArray(value) && value.length > 0) {
              return (
                <div
                  key={key}
                  className="p-3 rounded-md border border-border/50 bg-background/50"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {displayName}
                  </p>
                  <div className="space-y-2">
                    {value.map((param: any, index: number) => {
                      if (
                        param &&
                        typeof param === "object" &&
                        param.param_display_name &&
                        param.param_value
                      ) {
                        return (
                          <div key={index} className="text-sm text-foreground">
                            <span className="font-medium">
                              {param.param_display_name}
                            </span>
                            <span className="mx-2">:</span>
                            <span>{param.param_value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            }
          }

          return (
            <div
              key={key}
              className="p-3 rounded-md border border-border/50 bg-background/50"
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {displayName}
              </p>
              <p className="text-sm text-foreground">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOutputDataFields = (outputData: any) => {
    if (!outputData || typeof outputData !== "object") {
      return null;
    }

    // Get all keys except 'output_files'
    const otherFields = Object.entries(outputData).filter(
      ([key]) => key !== "output_files"
    );

    if (otherFields.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3 pt-4">
        <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
          <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
          Output Data
        </h3>
        {otherFields.map(([key, value]) => {
          // Skip null, undefined, or empty values
          if (value === null || value === undefined || value === "") {
            return null;
          }

          // Format the field name
          const displayName = formatFieldName(key);

          // Special handling for output_params
          if (key === "output_params" || key === "output-params") {
            // Check if value is an array of param objects
            if (Array.isArray(value) && value.length > 0) {
              return (
                <div
                  key={key}
                  className="p-3 rounded-md border border-border/50 bg-background/50"
                >
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    {displayName}
                  </p>
                  <div className="space-y-2">
                    {value.map((param: any, index: number) => {
                      if (
                        param &&
                        typeof param === "object" &&
                        param.param_display_name &&
                        param.param_value
                      ) {
                        return (
                          <div key={index} className="text-sm text-foreground">
                            <span className="font-medium">
                              {param.param_display_name}
                            </span>
                            <span className="mx-2">:</span>
                            <span>{param.param_value}</span>
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            }
          }

          return (
            <div
              key={key}
              className="p-3 rounded-md border border-border/50 bg-background/50"
            >
              <p className="text-xs font-medium text-muted-foreground mb-1">
                {displayName}
              </p>
              <p className="text-sm text-foreground">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderInputFiles = (inputFiles: Array<{
    file_display_name: string;
    ETA?: string | null;
    uploaded_files?: Array<{
      file_name: string;
      file_path: string;
      file_url?: string;
    }>;
    files?: Array<{
      file_name: string;
      file_path: string;
      file_url?: string;
    }>;
  }> | null) => {
    if (!inputFiles || !Array.isArray(inputFiles) || inputFiles.length === 0) {
      return null;
    }

    return (
      <div className="space-y-4 pt-4">
        <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
          <FileText className="w-4.5 h-4.5 text-btn-primary" />
          Input Files
        </h3>
        {inputFiles.map((inputFile, index) => {
          const actualFiles = inputFile.files || inputFile.uploaded_files || [];

          return (
            <div
              key={index}
              className="p-4 rounded-md border border-border/50 bg-background/30 space-y-3 max-w-[540px] overflow-x-auto mx-auto"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-foreground truncate">
                  {inputFile.file_display_name || "Input File"}
                </p>
                {inputFile.ETA && (
                  <div className="shrink-0 flex items-center gap-1.5 text-[14px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-100 dark:border-blue-800/50 shadow-sm">
                    <Clock className="w-3 h-3" />
                    <span>ETA: {formatDateTimeForSheet(inputFile.ETA)}</span>
                  </div>
                )}
              </div>
              {actualFiles && actualFiles.length > 0 ? (
                <div className="space-y-3">
                  {actualFiles.map((file, fileIndex) => {
                    return (
                      <div
                        key={fileIndex}
                        className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                      >
                        <File className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {file.file_name || "No file name"}
                          </p>
                          {(file.file_url || file.file_path) && (
                            <a
                              href={file.file_url || file.file_path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate block transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {file.file_url || file.file_path}
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  No files uploaded
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderOutputFiles = (
    outputFiles: OutputFile[] | OutputFilesObject | null
  ) => {
    if (!outputFiles) {
      return null;
    }

    // Handle object format (new API structure)
    let filesArray: OutputFile[] = [];

    if (Array.isArray(outputFiles)) {
      // Handle array format
      filesArray = outputFiles;
    } else if (typeof outputFiles === "object") {
      // Handle object format (new structure: { "INP-TALLY": { ... } })
      filesArray = Object.entries(outputFiles).map(([key, value]) => ({
        file_code_name: key,
        file_display_name: value.file_display_name || key,
        file_category: value.file_category,
        bot_totalInputcount: (value as any).bot_totalInputcount,
        bot_passcount: (value as any).bot_passcount,
        bot_failcount: (value as any).bot_failcount,
        uploaded_files: value.uploaded_files || [],
        files: value.files || [],
      }));
    }

    if (filesArray.length === 0) {
      return null;
    }

    // Group files by category
    const groupedFiles: Record<string, OutputFile[]> = {};

    filesArray.forEach((file) => {
      const category = file.file_category || "Output Files";
      if (!groupedFiles[category]) {
        groupedFiles[category] = [];
      }
      groupedFiles[category].push(file);
    });

    return (
      <div className="space-y-8 pt-6">
        {Object.entries(groupedFiles).map(([category, files]) => (
          <div key={category} className="space-y-4">
            <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
              <FileText className="w-4.5 h-4.5 text-btn-primary" />
              {category}
            </h3>
            {files.map((outputFile, index) => {
              const actualFiles =
                outputFile.files || outputFile.uploaded_files || [];

              return (
                <div
                  key={index}
                  className="p-4 rounded-md border border-border/50 bg-background/30 space-y-3 max-w-[540px] overflow-x-auto mx-auto"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {outputFile.file_display_name ||
                        outputFile.file_code_name}
                    </p>
                    {outputFile.file_code_name && (
                      <Badge variant="outline" className="text-xs">
                        {outputFile.file_code_name}
                      </Badge>
                    )}
                  </div>

                  {/* Counts Section */}
                  {(outputFile.bot_totalInputcount !== undefined ||
                    outputFile.bot_passcount !== undefined ||
                    outputFile.bot_failcount !== undefined) && (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/30">
                        {outputFile.bot_totalInputcount !== undefined && (
                          <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Total</span>
                            <span className="text-sm font-bold text-foreground">{outputFile.bot_totalInputcount}</span>
                          </div>
                        )}
                        {outputFile.bot_passcount !== undefined && (
                          <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60">Success</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-500 font-mono tracking-tight">{outputFile.bot_passcount}</span>
                          </div>
                        )}
                        {outputFile.bot_failcount !== undefined && (
                          <div className="flex flex-col gap-0.5 min-w-[60px]">
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/60">Failed</span>
                            <span className="text-sm font-bold text-rose-600 dark:text-rose-500 font-mono tracking-tight">{outputFile.bot_failcount}</span>
                          </div>
                        )}
                      </div>
                    )}
                  {actualFiles && actualFiles.length > 0 ? (
                    <div className="space-y-3">
                      {actualFiles.map((file, fileIndex) => {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        const fileKey = `${file.file_path}-${file.file_name}`;
                        // const isDownloading = downloadingFiles.has(fileKey);
                        // const hasDownloadableFile = file.file_path || file.file_url;

                        return (
                          <div
                            key={fileIndex}
                            className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-background hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                          >
                            <File className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0 space-y-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {file.file_name || "No file name"}
                              </p>
                              {(file.file_url || file.file_path) && (
                                <a
                                  href={file.file_url || file.file_path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-foreground hover:underline truncate block transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {file.file_url || file.file_path}
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No files uploaded
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:cursor-pointer">
          <EyeIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="min-w-xl sm:max-w-xl border-l border-border/30 shadow-2xl p-0">
        <SheetHeader className="p-6 border-b border-border/30 bg-card/30 backdrop-blur-xl space-y-2">
          <SheetTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Bot className="w-6 h-6 text-btn-primary" />
            View Bot Execution Details
          </SheetTitle>
          <SheetDescription className="text-sm font-medium text-muted-foreground">
            Detailed information about this bot execution.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-6 space-y-8 pb-12">
            {/* Main Identification Card */}
            <div className="grid grid-cols-1 gap-4">
              <div className="relative group p-5 rounded-2xl border border-btn-primary/20 bg-btn-primary/5 hover:bg-btn-primary/10 transition-all duration-500 overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Bot className="w-24 h-24 text-btn-primary" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-btn-primary mb-2">Bot Name</p>
                <p className="text-xl font-black text-foreground tracking-tight truncate">
                  {bot_name}
                </p>
              </div>

              {/* Display File Names from Input Files */}
              {processedData?.input_data?.input_files &&
                Array.isArray(processedData.input_data.input_files) &&
                processedData.input_data.input_files.length > 0 && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card/40 hover:border-border transition-all shadow-xs group">
                    <div className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-70">
                        Input File Name
                      </p>
                      <div className="space-y-1">
                        {processedData.input_data.input_files.map((inputFile: any, index: number) => {
                          const actualFiles = inputFile.files || inputFile.uploaded_files || [];
                          return actualFiles.map((file: any, fileIndex: number) => (
                            <p key={`${index}-${fileIndex}`} className="text-[15px] font-bold text-foreground tracking-tight truncate">
                              {file.file_name || "No file name"}
                            </p>
                          ));
                        })}
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Information Blocks */}
            <div className="grid grid-cols-1 gap-6">
              {/* Status Section */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                  <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                  Bot Information
                </h3>
                {processedData?.bot_status?.toUpperCase() === "FAILED" ? (
                  <>
                    {/* Row 1: Bot Status + Failure Reason */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField("Bot Status", processedData?.bot_status, undefined, (val) =>
                        getStatusBadge(val)
                      )}
                      {renderField(
                        "Failure Reason",
                        processedData?.bot_fail_reason,
                        <XCircle className="w-4 h-4 text-destructive" />
                      )}
                    </div>
                    {/* Row 2: Machine Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {renderField("Machine Name", processedData?.machine_name, <Bot className="w-4 h-4" />)}
                    </div>
                  </>
                ) : (
                  /* Default: Bot Status + Machine Name */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {renderField("Bot Status", processedData?.bot_status, undefined, (val) =>
                      getStatusBadge(val)
                    )}
                    {renderField("Machine Name", processedData?.machine_name, <Bot className="w-4 h-4" />)}
                  </div>
                )}
              </div>

              {/* Bot Meta Section */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                  <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                  Execution Details
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {/* Execution ID with copy button */}
                  {processedData?.bot_execution_id && (
                    <div className="flex items-start space-x-4 p-4 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/20 transition-all duration-300">
                      <div className="shrink-0 p-2 rounded-lg bg-primary/5 text-primary/70">
                        <Copy className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-70">
                          Execution ID
                        </p>
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-mono font-semibold text-foreground truncate leading-relaxed">
                            {processedData.bot_execution_id}
                          </p>
                          <button
                            onClick={handleCopyExecutionId}
                            title="Copy Execution ID"
                            className="shrink-0 p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {renderField("Bot Code", processedData?.bot_code)}
                  {renderField(
                    "Workflow Transaction Ref ID",
                    processedData?.wf_transaction_ref_id
                  )}
                </div>
              </div>

              {/* Timing Section */}
              <div className="space-y-4">
                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                  <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                  Execution Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderField(
                    "Created On",
                    processedData?.created_on,
                    <Calendar className="w-4 h-4" />,
                    formatDateTimeForSheet
                  )}
                  {renderField(
                    "Start Time",
                    processedData?.bot_start_time,
                    <Clock className="w-4 h-4" />,
                    formatDateTimeForSheet
                  )}
                  {renderField(
                    "End Time",
                    processedData?.bot_end_time,
                    <Clock className="w-4 h-4" />,
                    formatDateTimeForSheet
                  )}
                  {processedData?.bot_fail_reason &&
                    processedData?.bot_status?.toUpperCase() !== "FAILED" &&
                    renderField(
                      "Failure Reason",
                      processedData?.bot_fail_reason,
                      <XCircle className="w-4 h-4 text-destructive" />
                    )}
                </div>
              </div>

              {/* Input Data Fields (excluding input_files) */}
              {renderInputDataFields(processedData?.input_data)}

              {/* Input Files */}
              {renderInputFiles(processedData?.input_data?.input_files)}

              {/* Output Data Fields (excluding output_files) */}
              {renderOutputDataFields(processedData?.output_data)}

              {/* Output Files */}
              {renderOutputFiles(processedData?.output_data?.output_files)}
            </div>
          </div>
        </ScrollArea>
        <SheetFooter className="sticky bottom-0 bg-background border-t px-4 py-3 mt-2">
          <Button className="w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TbReconViewSheet;
