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
    Eye,
    Calendar,
    FileText,
    Clock,
    XCircle,
    CheckCircle2,
    Loader2,
    Copy,
    Bot,
    Monitor,
    User,
    Activity,
    AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

interface OrgExecutionViewSheetProps {
    data: any;
}

const OrgExecutionViewSheet = ({ data }: OrgExecutionViewSheetProps) => {
    const [open, setOpen] = useState(false);

    const handleCopyRecordId = async () => {
        if (!data?.record_id) {
            toast.error("Record ID not available");
            return;
        }

        try {
            await navigator.clipboard.writeText(data.record_id);
            toast.success("Record ID copied to clipboard");
        } catch (err) {
            console.error("Copy to clipboard error:", err);
            toast.error("Failed to copy Record ID");
        }
    };

    const handleCopyFlowSessionId = async () => {
        if (!data?.flow_session_id) {
            toast.error("Flow Session ID not available");
            return;
        }

        try {
            await navigator.clipboard.writeText(data.flow_session_id);
            toast.success("Flow Session ID copied to clipboard");
        } catch (err) {
            console.error("Copy to clipboard error:", err);
            toast.error("Failed to copy Flow Session ID");
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
        } else if (statusLower === "initiated" || statusLower === "running" || statusLower === "inprogress") {
            colorClass = "bg-[#3B82F6]/70 border-[#3B82F6] text-white dark:text-white";
            icon = <Loader2 className="w-3.5 h-3.5" />;
        }

        return (
            <Badge
                variant="outline"
                className={`flex items-center gap-1.5 px-2.5 py-1 font-bold tracking-tight rounded-full border transition-all shadow-sm ${colorClass}`}
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

    const formatRunDuration = (ms: number) => {
        if (!ms && ms !== 0) return "N/A";
        const seconds = Math.floor(ms / 1000);
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}h ` : ""}${m > 0 ? `${m}m ` : ""}${s}s`;
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                    <Eye className="w-4 h-4" />
                </Button>
            </SheetTrigger>
            <SheetContent className="min-w-xl sm:max-w-xl border-l border-border/30 shadow-2xl p-0">
                <SheetHeader className="p-6 border-b border-border/30 bg-card/30 backdrop-blur-xl space-y-2">
                    <SheetTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Bot className="w-6 h-6 text-btn-primary" />
                        View Execution Details
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium text-muted-foreground">
                        Detailed information about this bot execution.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-140px)]">
                    <div className="p-6 space-y-8 pb-12">
                        {/* Main Identification Card */}
                        <div className="grid grid-cols-1 gap-4">
                            {/* Bot Name Header */}
                            <div className="relative group p-5 rounded-2xl border border-btn-primary/20 bg-btn-primary/5 hover:bg-btn-primary/10 transition-all duration-500 overflow-hidden shadow-sm">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Bot className="w-24 h-24 text-btn-primary" />
                                </div>
                                <p className="text-xl font-black text-foreground tracking-tight truncate">
                                    {data?.bot_name || "N/A"}
                                </p>
                            </div>

                            {/* Record ID */}
                            {data?.record_id && (
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card/40 hover:border-border transition-all shadow-xs group">
                                    <div className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-70">
                                            Record ID
                                        </p>
                                        <p className="text-[15px] font-bold text-foreground font-mono tracking-tight truncate">
                                            {data.record_id}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={handleCopyRecordId}
                                            title="Copy Record ID"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Badge variant="outline" className="h-6 px-1.5 text-[9px] font-black uppercase tracking-tighter bg-background/50">
                                            ID
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            {/* Flow Session ID */}
                            {data?.flow_session_id && (
                                <div className="flex items-center gap-4 p-5 rounded-2xl border border-border/50 bg-card/40 hover:border-border transition-all shadow-xs group">
                                    <div className="shrink-0 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 opacity-70">
                                            Flow Session ID
                                        </p>
                                        <p className="text-[15px] font-bold text-foreground font-mono tracking-tight truncate">
                                            {data.flow_session_id}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 p-0 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                            onClick={handleCopyFlowSessionId}
                                            title="Copy Flow Session ID"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Badge variant="outline" className="h-6 px-1.5 text-[9px] font-black uppercase tracking-tighter bg-background/50">
                                            Session
                                        </Badge>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bot Information */}
                        <div className="space-y-4">
                            <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                Execution Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField("Status", data?.status, undefined, (val) =>
                                    getStatusBadge(val)
                                )}
                                {renderField(
                                    "Environment",
                                    data?.environment_name,
                                    <Monitor className="w-4 h-4" />
                                )}
                                {renderField(
                                    "Machine Name",
                                    data?.machine_name,
                                    <Monitor className="w-4 h-4" />
                                )}
                                {renderField("Machine Group", data?.machine_group)}
                                {renderField("Trigger Type", data?.trigger_type)}
                                {renderField("Source", data?.source)}
                                {renderField(
                                    "Created By",
                                    data?.created_by,
                                    <User className="w-4 h-4" />
                                )}
                            </div>
                        </div>

                        {/* Execution Timeline */}
                        <div className="space-y-4">
                            <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                Execution Timeline
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField(
                                    "Created On",
                                    data?.created_on,
                                    <Calendar className="w-4 h-4" />,
                                    formatDateTimeForSheet
                                )}
                                {renderField(
                                    "Bot Start Time",
                                    data?.bot_start_time,
                                    <Clock className="w-4 h-4" />,
                                    formatDateTimeForSheet
                                )}
                                {renderField(
                                    "Bot End Time",
                                    data?.bot_end_time,
                                    <Clock className="w-4 h-4" />,
                                    formatDateTimeForSheet
                                )}
                                {renderField(
                                    "Run Duration",
                                    data?.run_duration,
                                    <Clock className="w-4 h-4" />,
                                    formatRunDuration
                                )}
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-4">
                            <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                <span className="w-1.5 h-4 bg-btn-primary rounded-full"></span>
                                Performance Metrics
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderField(
                                    "RAM Usage",
                                    data?.ram_usage_percent
                                        ? `${data.ram_usage_percent}%`
                                        : null,
                                    <Activity className="w-4 h-4" />
                                )}
                                {renderField(
                                    "CPU Usage",
                                    data?.cpu_usage_percentage
                                        ? `${data.cpu_usage_percentage}%`
                                        : null,
                                    <Activity className="w-4 h-4" />
                                )}
                            </div>
                        </div>

                        {/* Error Information */}
                        {data?.error_message && data.error_message !== "None" && (
                            <div className="space-y-4">
                                <h3 className="text-[14px] font-extrabold text-foreground flex items-center gap-2 px-1">
                                    <AlertCircle className="w-4.5 h-4.5 text-destructive" />
                                    Error Details
                                </h3>
                                <div className="p-4 rounded-xl border border-destructive/50 bg-destructive/5">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-70">
                                        Error Message
                                    </p>
                                    <p className="text-[14px] font-semibold text-foreground break-words leading-relaxed">
                                        {data.error_message}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <SheetFooter className="sticky bottom-0 bg-background border-t px-4 py-3 mt-2">
                    <Button className="w-full" onClick={() => setOpen(false)}>
                        Close
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default OrgExecutionViewSheet;
