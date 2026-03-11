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
    Calendar,
    FileText,
    Clock,
    XCircle,
    CheckCircle2,
    Loader2,
    Copy,
    User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/format";

interface FormLogViewSheetProps {
    data: any;
    form_name: string;
}

const FormLogViewSheet = ({ data, form_name }: FormLogViewSheetProps) => {
    const [open, setOpen] = useState(false);

    const handleCopyExecutionId = async () => {
        if (!data?.form_execution_id) {
            toast.error("Execution ID not available");
            return;
        }

        try {
            await navigator.clipboard.writeText(data.form_execution_id);
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
        const statusLower = status?.toLowerCase() || "";
        let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
        let icon = <Loader2 className="w-3 h-3" />;

        if (statusLower === "completed" || statusLower === "success" || statusLower === "succeeded") {
            variant = "default";
            icon = <CheckCircle2 className="w-3 h-3" />;
        } else if (statusLower === "failed" || statusLower === "error") {
            variant = "destructive";
            icon = <XCircle className="w-3 h-3" />;
        } else if (
            statusLower === "initiated" ||
            statusLower === "running" ||
            statusLower === "in-progress"
        ) {
            variant = "secondary";
            icon = <Loader2 className="w-3 h-3" />;
        }

        return (
            <Badge variant={variant} className="flex items-center gap-1">
                {icon}
                {status}
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
            <div className="flex items-start space-x-3 p-3 rounded-md border border-border/50 bg-background/50">
                {icon && (
                    <div className="shrink-0 mt-0.5 text-muted-foreground">{icon}</div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                        {label}
                    </p>
                    <div className="text-sm text-foreground">
                        {formatter ? formatter(value) : String(value)}
                    </div>
                </div>
            </div>
        );
    };

    const formatFieldName = (key: string): string => {
        return key
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(" ");
    };

    const renderFormData = (formData: any) => {
        if (!formData || typeof formData !== "object") {
            return null;
        }

        const fields = Object.entries(formData);
        if (fields.length === 0) return null;

        return (
            <div className="space-y-2 mt-4">
                <h3 className="text-sm font-semibold text-foreground">Form Data</h3>
                <div className="grid grid-cols-1 gap-2">
                    {fields.map(([key, value]) => (
                        <div key={key} className="p-3 rounded-md border border-border/50 bg-background/50">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                {formatFieldName(key)}
                            </p>
                            <p className="text-sm text-foreground break-all">
                                {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:cursor-pointer">
                    <EyeIcon size={16} />
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl">
                <SheetHeader className="p-2 px-3 border-b border-border pb-4">
                    <SheetTitle>View Form Execution Details</SheetTitle>
                    <SheetDescription>
                        Detailed information about this form execution.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] pr-4">
                    <div className="space-y-4 text-sm p-4">
                        {/* Header Info */}
                        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
                            <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                                <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-muted-foreground mb-1">
                                    Form Name
                                </p>
                                <p className="text-base font-semibold text-foreground font-mono tracking-wide">
                                    {form_name}
                                </p>
                            </div>
                        </div>

                        {/* Execution ID */}
                        {data?.form_execution_id && (
                            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-border/50">
                                <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Execution ID
                                    </p>
                                    <p className="text-base font-semibold text-foreground font-mono tracking-wide">
                                        {data.form_execution_id}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0"
                                    onClick={handleCopyExecutionId}
                                    title="Copy Execution ID"
                                >
                                    <Copy className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                Execution Status
                            </h3>
                            {renderField("Form Status", data?.form_status, undefined, (val) =>
                                getStatusBadge(val)
                            )}
                            {renderField("Bot Status", data?.bot_status, undefined, (val) =>
                                getStatusBadge(val)
                            )}
                        </div>

                        {/* Timestamps */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                Timestamps
                            </h3>
                            {renderField(
                                "Created On",
                                data?.created_on,
                                <Calendar className="w-4 h-4" />,
                                formatDateTimeForSheet
                            )}
                            {renderField(
                                "Updated On",
                                data?.updated_on,
                                <Clock className="w-4 h-4" />,
                                formatDateTimeForSheet
                            )}
                        </div>

                        {/* User Info */}
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-foreground">
                                User Information
                            </h3>
                            {renderField("Created By", data?.created_by, <User className="w-4 h-4" />)}
                            {renderField("Updated By", data?.updated_by, <User className="w-4 h-4" />)}
                        </div>

                        {/* Form Data */}
                        {renderFormData(data?.form_data)}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};

export default FormLogViewSheet;
