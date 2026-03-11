import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CHART_UI } from "@/components/dashboard/colors";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import EmptyState from "@/components/common/EmptyState";

interface FailedBotData {
    failed: number;
    bot_fail_reason: string;
}

interface BotFailureProps {
    failedBotData?: FailedBotData[];
}

// Expanded color palette for more failure reasons
const COLORS = ["#3949AB", "#43A047", "#E53935", "#FFC107", "#9C27B0", "#00BCD4", "#FF5722", "#795548", "#607D8B", "#FF9800"];

export default function BotFailure({ failedBotData }: BotFailureProps) {
    const safeData = failedBotData ?? [];
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Sort by failure count and get top 3
    const sortedData = [...safeData].sort((a, b) => b.failed - a.failed);
    const top3Data = sortedData.slice(0, 3);
    const hasMoreData = sortedData.length > 3;

    // Calculate total failures
    const totalFail = safeData.reduce((sum, item) => sum + item.failed, 0);

    const getPercentage = (value: number): string => {
        if (totalFail === 0) return "0";
        return ((value / totalFail) * 100).toFixed(1);
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const percentage = getPercentage(data.failed);

            return (
                <div className="rounded-lg shadow-lg p-2 text-xs max-w-xs" style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}>
                    <p className="font-semibold mb-1">Failure Reason</p>
                    <p className="mb-1 break-words" style={{ opacity: 0.8 }}>
                        {data.bot_fail_reason}
                    </p>
                    <div className="flex justify-between gap-4">
                        <span>Count: <span className="font-bold">{data.failed}</span></span>
                        <span style={{ opacity: 0.7 }}>{percentage}%</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <Card className="h-full p-3 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="mb-1.5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                        Bot Failure
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                        Top 3 failure reasons
                    </p>
                </div>
                {safeData.length > 0 && (
                    <div className="flex items-center gap-2">
                        <div className="bg-destructive/10 px-2 py-0.5 rounded-lg border border-destructive/20">
                            <p className="text-[10px] text-muted-foreground">Failures Count : <span className="text-base font-bold text-destructive">{totalFail}</span></p>
                        </div>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                                    <Eye className="h-4 w-4" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="min-w-6xl max-h-[90vh]">
                                <DialogHeader>
                                    <DialogTitle>All Failure Reasons ({sortedData.length})</DialogTitle>
                                </DialogHeader>

                                {/* Pie Chart + Error Reasons Layout */}
                                <div className="flex items-start gap-4 p-2">
                                    {/* Left: Pie Chart (2/5 width - larger) */}
                                    <div className="w-2/5 h-[500px] shrink-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={sortedData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius="35%"
                                                    outerRadius="80%"
                                                    paddingAngle={1}
                                                    dataKey="failed"
                                                    stroke="none"
                                                    isAnimationActive={true}
                                                    animationDuration={800}
                                                    animationBegin={0}
                                                    label={(entry) => {
                                                        const percentage = getPercentage(entry.failed);
                                                        if (parseFloat(percentage) < 3) return '';
                                                        return (
                                                            <text
                                                                x={entry.x}
                                                                y={entry.y}
                                                                fill={COLORS[entry.index % COLORS.length]}
                                                                textAnchor={entry.x > entry.cx ? 'start' : 'end'}
                                                                dominantBaseline="central"
                                                                className="text-[10px] font-bold"
                                                            >
                                                                {`${percentage}%`}
                                                            </text>
                                                        );
                                                    }}
                                                    labelLine={false}
                                                >
                                                    {sortedData.map((_entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Right: Scrollable Error Reasons (3/5 width) */}
                                    <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[500px] pr-2">
                                        {sortedData.map((item, index) => (
                                            <div
                                                key={index}
                                                className="p-3 rounded-lg border-2 hover:bg-accent/30 transition-colors"
                                                style={{ borderColor: COLORS[index % COLORS.length] }}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <span
                                                            className="w-3 h-3 rounded-full shrink-0 mt-0.5"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <p className="text-sm text-foreground break-words leading-relaxed">
                                                            {item.bot_fail_reason}
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0 ml-2">
                                                        <span className="font-bold text-lg" style={{ color: COLORS[index % COLORS.length] }}>
                                                            {getPercentage(item.failed)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>

            {safeData.length === 0 ? (
                <div className="flex-1">
                    <EmptyState />
                </div>
            ) : (
                <div className="flex-1 flex items-center min-h-0">
                    {/* Left: Pie Chart */}
                    <div
                        className="w-1/2 h-full"
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={top3Data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="45%"
                                    outerRadius="65%"
                                    paddingAngle={2}
                                    dataKey="failed"
                                    stroke="none"
                                    isAnimationActive={false}
                                    label={(entry) => {
                                        const percentage = getPercentage(entry.failed);
                                        if (parseFloat(percentage) < 1) return '';
                                        return (
                                            <text
                                                x={entry.x}
                                                y={entry.y}
                                                fill={COLORS[entry.index % COLORS.length]}
                                                textAnchor={entry.x > entry.cx ? 'start' : 'end'}
                                                dominantBaseline="central"
                                                className="text-[10px] font-bold"
                                            >
                                                {`${percentage}%`}
                                            </text>
                                        );
                                    }}
                                    labelLine={false}
                                    onMouseEnter={(_, index) => setActiveIndex(index)}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {top3Data.map((_entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Right: Legend */}
                    <div className="w-1/2 flex flex-col justify-center gap-1.5 pl-2">
                        {top3Data.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between px-2 py-1 rounded border-2 text-xs"
                                style={{ borderColor: `color-mix(in srgb, ${COLORS[index % COLORS.length]}, transparent 50%)` }}
                            >
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-muted-foreground truncate" title={item.bot_fail_reason}>
                                        {item.bot_fail_reason.length > 20
                                            ? `${item.bot_fail_reason.substring(0, 20)}...`
                                            : item.bot_fail_reason}
                                    </span>
                                </div>
                                <span className="font-medium shrink-0 ml-2 text-[10px]" style={{ color: COLORS[index % COLORS.length] }}>
                                    {getPercentage(item.failed)}%
                                </span>
                            </div>
                        ))}
                        {hasMoreData && (
                            <button
                                onClick={() => setDialogOpen(true)}
                                className="text-xs text-btn-primary hover:underline text-left px-2 py-1"
                            >
                                + {sortedData.length - 3} more reasons
                            </button>
                        )}
                    </div>
                </div>
            )}
        </Card>
    );
}