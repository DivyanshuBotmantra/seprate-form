import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    EyeIcon,
    FileText,
    File,
    Clock,
    XCircle,
    CheckCircle2,
    Loader2,
    Copy,
    Layers,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ViewSheetCategoryProps {
    data: any;
    bot_category: string;
}

const ViewSheetCategory = ({ data, bot_category }: ViewSheetCategoryProps) => {
    const [open, setOpen] = useState(false);

    // Helper to safely parse stringified dictionaries
    const safeParse = (val: any) => {
        if (typeof val !== "string") return val;
        if (!val || val === "null" || val === "None") return null;
        try {
            return JSON.parse(val);
        } catch {
            try {
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

    const handleCopyExecutionId = async () => {
        if (!processedData?.bot_execution_id) {
            toast.error("Execution ID not available");
            return;
        }
        try {
            await navigator.clipboard.writeText(processedData.bot_execution_id);
            toast.success("Execution ID copied to clipboard");
        } catch {
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

        if (
            statusLower === "succeeded" ||
            statusLower === "success" ||
            statusLower === "completed" ||
            statusLower === "submitted"
        ) {
            colorClass = "bg-success/70 border-success text-white dark:text-white";
            icon = <CheckCircle2 className="w-3.5 h-3.5" />;
        } else if (
            statusLower === "failed" ||
            statusLower === "error" ||
            statusLower === "rejected"
        ) {
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
        if (value === null || value === undefined || value === "") return null;

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

    const formatFieldName = (key: string): string =>
        key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");

    const renderInputDataFields = (inputData: any) => {
        if (!inputData || typeof inputData !== "object") return null;
        const otherFields = Object.entries(inputData).filter(
            ([key]) => key !== "input_files"
        );
        if (otherFields.length === 0) return null;

        return (
            <div className="space-y-3 pt-4">
                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                    <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                    Input Data
                </h3>
                {otherFields.map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null;
                    const displayName = formatFieldName(key);
                    return (
                        <div
                            key={key}
                            className="p-3 rounded-md border border-border/50 bg-background/50"
                        >
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                {displayName}
                            </p>
                            <p className="text-sm text-foreground">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderOutputDataFields = (outputData: any) => {
        if (!outputData || typeof outputData !== "object") return null;
        const otherFields = Object.entries(outputData).filter(
            ([key]) => key !== "output_files"
        );
        if (otherFields.length === 0) return null;

        return (
            <div className="space-y-3 pt-4">
                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                    <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                    Output Data
                </h3>
                {otherFields.map(([key, value]) => {
                    if (value === null || value === undefined || value === "") return null;
                    const displayName = formatFieldName(key);
                    return (
                        <div
                            key={key}
                            className="p-3 rounded-md border border-border/50 bg-background/50"
                        >
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                {displayName}
                            </p>
                            <p className="text-sm text-foreground">
                                {typeof value === "object" ? JSON.stringify(value) : String(value)}
                            </p>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderInputFiles = (
        inputFiles: Array<{
            file_display_name: string;
            ETA?: string | null;
            uploaded_files?: Array<{ file_name: string; file_path: string; file_url?: string }>;
            files?: Array<{ file_name: string; file_path: string; file_url?: string }>;
        }> | null
    ) => {
        if (!inputFiles || !Array.isArray(inputFiles) || inputFiles.length === 0)
            return null;

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
                                    {actualFiles.map((file, fileIndex) => (
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
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground italic">No files uploaded</p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                    <EyeIcon />
                </Button>
            </SheetTrigger>
            <SheetContent className="min-w-xl sm:max-w-xl border-l border-border/30 shadow-2xl p-0">
                <SheetHeader className="p-6 border-b border-border/30 bg-card/30 backdrop-blur-xl space-y-2">
                    <SheetTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Layers className="w-6 h-6 text-btn-primary" />
                        View Execution Details
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium text-muted-foreground">
                        Detailed information about this bot execution.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-140px)]">
                    <div className="p-6 space-y-8 pb-12">
                        {/* Category header card */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="relative group p-5 rounded-2xl border border-btn-primary/20 bg-btn-primary/5 hover:bg-btn-primary/10 transition-all duration-500 overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Layers className="w-24 h-24 text-btn-primary" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-btn-primary mb-2">
                                    Bot Category
                                </p>
                                <p className="text-xl font-black text-foreground tracking-tight truncate">
                                    {bot_category}
                                </p>
                                {processedData?.bot_name && (
                                    <p className="text-sm font-medium text-muted-foreground mt-1">
                                        {processedData.bot_name}
                                    </p>
                                )}
                            </div>

                            {/* Input file names */}
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
                                                {processedData.input_data.input_files.map(
                                                    (inputFile: any, index: number) => {
                                                        const actualFiles =
                                                            inputFile.files || inputFile.uploaded_files || [];
                                                        return actualFiles.map((file: any, fileIndex: number) => (
                                                            <p
                                                                key={`${index}-${fileIndex}`}
                                                                className="text-[15px] font-bold text-foreground tracking-tight truncate"
                                                            >
                                                                {file.file_name || "No file name"}
                                                            </p>
                                                        ));
                                                    }
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Bot Information */}
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-4">
                                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                    <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                    Bot Information
                                </h3>
                                {processedData?.bot_status?.toUpperCase() === "FAILED" ? (
                                    <>
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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {renderField("Machine Name", processedData?.machine_name)}
                                        </div>
                                    </>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {renderField("Bot Status", processedData?.bot_status, undefined, (val) =>
                                            getStatusBadge(val)
                                        )}
                                        {renderField("Machine Name", processedData?.machine_name)}
                                    </div>
                                )}
                            </div>

                            {/* Execution Details */}
                            <div className="space-y-4">
                                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                    <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                    Execution Details
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Execution ID with copy */}
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
                                    {renderField("Bot Name", processedData?.bot_name)}
                                    {renderField("Created By", processedData?.created_by)}
                                    {renderField(
                                        "Created On",
                                        processedData?.created_on,
                                        undefined,
                                        (val) => formatDateTimeForSheet(val)
                                    )}
                                    {renderField(
                                        "Bot Start Time",
                                        processedData?.bot_start_time,
                                        <Clock className="w-4 h-4" />,
                                        (val) => formatDateTimeForSheet(val)
                                    )}
                                    {renderField(
                                        "Bot End Time",
                                        processedData?.bot_end_time,
                                        <Clock className="w-4 h-4" />,
                                        (val) => formatDateTimeForSheet(val)
                                    )}
                                </div>
                            </div>

                            {/* list_param fields */}
                            {processedData?.list_param &&
                                typeof processedData.list_param === "object" &&
                                Object.keys(processedData.list_param).length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                            <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                            Parameters
                                        </h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {Object.entries(processedData.list_param).map(([key, value]) =>
                                                renderField(formatFieldName(key), value)
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Input Data */}
                            {renderInputDataFields(processedData?.input_data)}

                            {/* Input Files */}
                            {renderInputFiles(processedData?.input_data?.input_files ?? null)}

                            {/* Output Data */}
                            {renderOutputDataFields(processedData?.output_data)}
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default ViewSheetCategory;
