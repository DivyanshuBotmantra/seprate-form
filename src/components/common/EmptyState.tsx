
import { Inbox } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    subtitle?: string;
    className?: string;
}

export default function EmptyState({
    title = "No data available",
    subtitle = "No executions found for selected filters",
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center w-full h-full p-6 text-center rounded-lg bg-muted/5 ${className}`}>
            <div className="flex items-center justify-center w-12 h-12 mb-3 rounded-full bg-muted">
                <Inbox className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
    );
}
