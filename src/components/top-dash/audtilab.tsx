import { Card } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { CheckCircle2, XCircle, Clock, Circle } from "lucide-react";
import { useState } from "react";

interface AuditCategory {
    name: string;
    auditorSampling: { status: any; data: any };
    systemSampling: { status: any; data: any };
    auditing: { status: any; data: any };
}

const generateMockData = (status: any) => ({
    executions: Math.floor(Math.random() * 5) + 1,
    initiatedBy: "John Doe",
    initiatedOn: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }),
    status:
        status === "success"
            ? "SUCCESS"
            : status === "failed"
                ? "FAILED"
                : status === "progress"
                    ? "IN PROGRESS"
                    : "NOT STARTED",
});

const statusConfig = {
    success: {
        label: "Completed",
        icon: CheckCircle2,
        bgColor:
            "bg-emerald-500/20 dark:bg-emerald-500/10 hover:bg-emerald-500/30 dark:hover:bg-emerald-500/20",
        borderColor: "border-emerald-500/30",
        iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        bgColor:
            "bg-red-500/20 dark:bg-red-500/10 hover:bg-red-500/30 dark:hover:bg-red-500/20",
        borderColor: "border-red-500/30",
        iconColor: "text-red-600 dark:text-red-400",
    },
    progress: {
        label: "In Progress",
        icon: Clock,
        bgColor:
            "bg-amber-500/20 dark:bg-amber-500/10 hover:bg-amber-500/30 dark:hover:bg-amber-500/20",
        borderColor: "border-amber-500/30",
        iconColor: "text-amber-600 dark:text-amber-400",
    },
    pending: {
        label: "Not Started",
        icon: Circle,
        bgColor:
            "bg-gray-500/20 dark:bg-gray-500/10 hover:bg-gray-500/30 dark:hover:bg-gray-500/20",
        borderColor: "border-gray-500/30",
        iconColor: "text-gray-600 dark:text-gray-400",
    },
};

interface SectionProps {
    label: string;
    status: any;
    data: any;
    effectiveStatus?: any;
}

const SamplingSection = ({
    label,
    status,
    data,
    effectiveStatus,
}: SectionProps) => {
    const [open, setOpen] = useState(false);
    // Use effectiveStatus if provided (for dependency logic), otherwise use original status
    const displayStatus =
        effectiveStatus !== undefined ? effectiveStatus : status;
    const config = statusConfig[displayStatus as keyof typeof statusConfig];
    const Icon = config.icon;

    // Get the status text based on effective status
    const statusText =
        displayStatus === "success"
            ? "SUCCESS"
            : displayStatus === "failed"
                ? "FAILED"
                : displayStatus === "progress"
                    ? "IN PROGRESS"
                    : "NOT STARTED";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div
                    onMouseEnter={() => setOpen(true)}
                    onMouseLeave={() => setOpen(false)}
                    className={`flex-1 flex flex-col items-center justify-center py-3 cursor-pointer transition-all duration-300 ${config.bgColor} border-b last:border-b-0 ${config.borderColor}`}
                >
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center mb-2">
                        {label}
                    </span>
                    <Icon className={`w-6 h-6 ${config.iconColor}`} />
                </div>
            </PopoverTrigger>
            <PopoverContent
                className="w-72 p-0 shadow-2xl"
                align="center"
                onMouseEnter={() => setOpen(true)}
                onMouseLeave={() => setOpen(false)}
            >
                <div className="bg-card border-2 rounded-xl shadow-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 border-b-2">
                        <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${config.iconColor}`} />
                            {label} - Execution Details
                        </h4>
                    </div>
                    <div className="p-3 space-y-2 bg-muted/20">
                        <div className="flex justify-between items-center p-2 bg-card rounded-lg">
                            <span className="text-xs font-medium text-muted-foreground">
                                Total Executions
                            </span>
                            <span className="font-bold text-sm text-foreground px-2 py-0.5 bg-primary/10 rounded-full">
                                {data.executions}
                            </span>
                        </div>
                        <div className="flex justify-between items-start p-2 bg-card rounded-lg">
                            <span className="text-xs font-medium text-muted-foreground">
                                Initiated By
                            </span>
                            <span className="font-semibold text-xs text-foreground text-right">
                                {data.initiatedBy}
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-card rounded-lg">
                            <span className="text-xs font-medium text-muted-foreground">
                                Initiated On
                            </span>
                            <span className="font-semibold text-xs text-foreground">
                                {data.initiatedOn}
                            </span>
                        </div>
                        <div className="pt-2 border-t-2">
                            <div className="flex items-center justify-between p-2 bg-card rounded-lg">
                                <span className="text-xs font-medium text-muted-foreground">
                                    Status
                                </span>
                                <div
                                    className={`rounded-full px-2 py-1 flex items-center border-2 ${config.borderColor}`}
                                >
                                    <Icon className={`w-3 h-3 mr-1 ${config.iconColor}`} />
                                    <span
                                        className={`text-xs font-bold uppercase tracking-wide ${config.iconColor}`}
                                    >
                                        {statusText}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const auditCategories: AuditCategory[] = [
    {
        name: "Revenue",
        auditorSampling: { status: "success", data: generateMockData("success") },
        systemSampling: { status: "success", data: generateMockData("success") },
        auditing: { status: "pending", data: generateMockData("pending") },
    },
    {
        name: "Cost of Goods Sold",
        auditorSampling: { status: "success", data: generateMockData("success") },
        systemSampling: { status: "progress", data: generateMockData("progress") },
        auditing: { status: "success", data: generateMockData("success") },
    },
    {
        name: "Property, Plant & Equipment",
        auditorSampling: { status: "failed", data: generateMockData("failed") },
        systemSampling: { status: "success", data: generateMockData("success") },
        auditing: { status: "progress", data: generateMockData("progress") },
    },
    {
        name: "Pre-payment",
        auditorSampling: { status: "pending", data: generateMockData("pending") },
        systemSampling: { status: "success", data: generateMockData("success") },
        auditing: { status: "success", data: generateMockData("success") },
    },
    {
        name: "Journal Entry",
        auditorSampling: { status: "success", data: generateMockData("success") },
        systemSampling: { status: "failed", data: generateMockData("failed") },
        auditing: { status: "pending", data: generateMockData("pending") },
    },
    {
        name: "Intangible Assets",
        auditorSampling: { status: "success", data: generateMockData("success") },
        systemSampling: { status: "progress", data: generateMockData("progress") },
        auditing: { status: "success", data: generateMockData("success") },
    },
    {
        name: "Deposits",
        auditorSampling: { status: "progress", data: generateMockData("progress") },
        systemSampling: { status: "success", data: generateMockData("success") },
        auditing: { status: "failed", data: generateMockData("failed") },
    },
    {
        name: "Administrative & General Expenses",
        auditorSampling: { status: "success", data: generateMockData("success") },
        systemSampling: { status: "success", data: generateMockData("success") },
        auditing: { status: "success", data: generateMockData("success") },
    },
];

// Helper function to determine effective status based on dependencies
const getEffectiveStatus = (
    currentStatus: string,
    previousStatus: string | null
): string => {
    // If previous step is not completed (not "success"), block current step
    if (previousStatus !== null && previousStatus !== "success") {
        // If current status is "success" but previous isn't, show as "pending"
        if (currentStatus === "success") {
            return "pending";
        }
        // If current status is "progress" but previous isn't completed, show as "pending"
        if (currentStatus === "progress" && previousStatus !== "success") {
            return "pending";
        }
    }
    return currentStatus;
};

export const AuditTable = () => {
    return (
        <div className="space-y-4">
            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {auditCategories.map((category) => {
                    // Calculate effective statuses based on dependencies
                    const auditorStatus = category.auditorSampling.status;
                    const systemEffectiveStatus = getEffectiveStatus(
                        category.systemSampling.status,
                        auditorStatus
                    );
                    const auditingEffectiveStatus = getEffectiveStatus(
                        category.auditing.status,
                        systemEffectiveStatus === "success"
                            ? "success"
                            : systemEffectiveStatus
                    );

                    return (
                        <Card
                            key={category.name}
                            className="bg-card border shadow-md hover:shadow-lg transition-all duration-300 hover:border-primary/20 group overflow-hidden p-0 gap-0 flex flex-col h-full"
                        >
                            {/* Category Name */}
                            <div className="px-4 py-3 bg-gradient-to-r from-primary/15 via-primary/30 to-transparent border-b border-primary/10 flex-shrink-0">
                                <h3 className="text-lg font-semibold text-foreground tracking-tight leading-tight">
                                    {category.name}
                                </h3>
                            </div>

                            {/* Three Sections */}
                            <div className="flex flex-col flex-1">
                                <SamplingSection
                                    label="Auditor Sampling"
                                    status={category.auditorSampling.status}
                                    data={category.auditorSampling.data}
                                />
                                <SamplingSection
                                    label="System Sampling"
                                    status={category.systemSampling.status}
                                    data={category.systemSampling.data}
                                    effectiveStatus={systemEffectiveStatus}
                                />
                                <SamplingSection
                                    label="Auditing"
                                    status={category.auditing.status}
                                    data={category.auditing.data}
                                    effectiveStatus={auditingEffectiveStatus}
                                />
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};
