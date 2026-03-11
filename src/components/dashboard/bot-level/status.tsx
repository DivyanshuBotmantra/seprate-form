import { Card } from "@/components/ui/card";
import { STATUS_COLORS, STATUS_BG_COLORS } from "@/components/dashboard/colors";
import { cn } from "@/lib/utils";

interface SummaryIndex {
    totalExecutions: number;
    inProgress: number;
    succeeded: number;
    failed: number;
    initiated: number;
}

interface StatusProps {
    summaryIndex?: Partial<SummaryIndex>;
    onStatusClick?: (status: string) => void;
}

export default function Status({ summaryIndex, onStatusClick }: StatusProps) {
    const safeSummary: SummaryIndex = {
        totalExecutions: summaryIndex?.totalExecutions ?? 0,
        inProgress: summaryIndex?.inProgress ?? 0,
        succeeded: summaryIndex?.succeeded ?? 0,
        failed: summaryIndex?.failed ?? 0,
        initiated: summaryIndex?.initiated ?? 0,
    };

    const statusCards = [
        {
            label: "TOTAL",
            value: safeSummary.totalExecutions,
            color: STATUS_COLORS.total,
            bgColor: STATUS_BG_COLORS.total,
            apiStatus: "",
        },
        {
            label: "INITIATED",
            value: safeSummary.initiated,
            color: STATUS_COLORS.initiated,
            bgColor: STATUS_BG_COLORS.initiated,
            apiStatus: "INITIATED",
        },
        {
            label: "IN-PROGRESS",
            value: safeSummary.inProgress,
            color: STATUS_COLORS.inProgress,
            bgColor: STATUS_BG_COLORS.inProgress,
            apiStatus: "IN-PROGRESS",
        },
        {
            label: "SUCCEEDED",
            value: safeSummary.succeeded,
            color: STATUS_COLORS.succeeded,
            bgColor: STATUS_BG_COLORS.succeeded,
            apiStatus: "SUCCEEDED",
        },
        {
            label: "FAILED",
            value: safeSummary.failed,
            color: STATUS_COLORS.failed,
            bgColor: STATUS_BG_COLORS.failed,
            apiStatus: "FAILED",
        },
    ];


    // Calculate percentage (out of total)
    const getPercentage = (value: number) => {
        if (safeSummary.totalExecutions === 0) return 0;
        return Math.round((value / safeSummary.totalExecutions) * 100);
    };

    return (
        <div className="grid grid-cols-5 gap-2">
            {statusCards.map((card, index) => (
                <Card
                    key={card.label}
                    style={{
                        // @ts-ignore - CSS variable for hover
                        '--hover-bg': `color-mix(in srgb, ${card.color}, transparent 90%)`,
                    } as React.CSSProperties}
                    onClick={() => {
                        if (card.apiStatus !== null && onStatusClick) {
                            onStatusClick(card.apiStatus);
                        }
                    }}
                    className={cn(
                        "bg-card shadow-sm hover:shadow-md transition-all duration-200 rounded-lg p-1.5 group overflow-hidden",
                        card.apiStatus !== null ? "cursor-pointer hover:bg-[var(--hover-bg)]" : ""
                    )}
                >
                    <div className="flex items-center justify-between gap-2 w-full">
                        <h3 className="text-[10px] font-bold text-foreground uppercase tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
                            {card.label}
                        </h3>
                        {index === 0 ? (
                            // For TOTAL, show count with full ring
                            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                                <svg className="transform -rotate-90" width="44" height="44">
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r={18}
                                        fill="none"
                                        stroke={card.bgColor}
                                        strokeWidth="4"
                                        style={{ transition: 'stroke 0.2s ease-in-out' }}
                                    />
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r={18}
                                        fill="none"
                                        stroke={card.color}
                                        strokeWidth="4"
                                        strokeDasharray={`${2 * Math.PI * 18}`}
                                        strokeDashoffset="0"
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke 0.2s ease-in-out' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-foreground transition-colors duration-200">{card.value}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
                                <svg className="transform -rotate-90" width="44" height="44">
                                    {/* Background circle */}
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r={18}
                                        fill="none"
                                        stroke={card.bgColor}
                                        strokeWidth="4"
                                        style={{ transition: 'stroke 0.2s ease-in-out' }}
                                    />
                                    {/* Progress circle */}
                                    <circle
                                        cx="22"
                                        cy="22"
                                        r={18}
                                        fill="none"
                                        stroke={card.color}
                                        strokeWidth="4"
                                        strokeDasharray={2 * Math.PI * 18}
                                        strokeDashoffset={2 * Math.PI * 18 - (getPercentage(card.value) / 100) * 2 * Math.PI * 18}
                                        strokeLinecap="round"
                                        className="transition-all duration-200"
                                        style={{ transitionProperty: 'stroke, stroke-dashoffset' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-sm font-bold text-foreground transition-colors duration-200">{card.value}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            ))}
        </div>
    );
}
