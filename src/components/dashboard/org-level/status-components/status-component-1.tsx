import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_COLORS, CHART_UI } from "@/components/dashboard/colors";
import EmptyState from "@/components/common/EmptyState";

interface SummaryIndexPercentage {
    totalExecutions: number;
    inProgress: number;
    succeeded: number;
    failed: number;
    initiated: number;
}

interface SummaryIndex {
    totalExecutions: number;
    inProgress: number;
    succeeded: number;
    failed: number;
    initiated: number;
}

interface StatusComponent1Props {
    summaryIndexPercentage?: SummaryIndexPercentage;
    summaryIndex?: SummaryIndex;
}

export default function StatusComponent1({ summaryIndexPercentage, summaryIndex }: StatusComponent1Props) {
    // Check if data is effectively empty
    const isDataEmpty = !summaryIndexPercentage || summaryIndexPercentage.totalExecutions === 0;

    const safeSummary: SummaryIndexPercentage = {
        totalExecutions: summaryIndexPercentage?.totalExecutions ?? 100,
        inProgress: summaryIndexPercentage?.inProgress ?? 0,
        succeeded: summaryIndexPercentage?.succeeded ?? 0,
        failed: summaryIndexPercentage?.failed ?? 0,
        initiated: summaryIndexPercentage?.initiated ?? 0,
    };

    const data = [
        {
            name: "Succeeded",
            value: safeSummary.succeeded,
            color: STATUS_COLORS.succeeded,
            count: summaryIndex?.succeeded ?? null,
            total: summaryIndex?.totalExecutions ?? null,
        },
        {
            name: "Failed",
            value: safeSummary.failed,
            color: STATUS_COLORS.failed,
            count: summaryIndex?.failed ?? null,
            total: summaryIndex?.totalExecutions ?? null,
        },
    ];

    const chartData = data.filter((item) => item.value > 0);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="rounded-lg shadow-lg p-2 text-xs"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="font-semibold">{payload[0].name}</p>
                    <p style={{ opacity: 0.8 }}>
                        {Number(payload[0].value).toFixed(2)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-[95%] flex flex-col">
            <div className="mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                    Status Distribution
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1 ml-3 font-medium">Organization-wide status distribution</p>
            </div>

            <div className="flex-1 min-h-0">
                {isDataEmpty ? (
                    <EmptyState />
                ) : (
                    <div className="flex items-center h-full gap-4">
                        <div
                            className="max-h-[150px] flex-1 h-full"
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="45%"
                                        outerRadius="65%"
                                        paddingAngle={2}
                                        dataKey="value"
                                        stroke="none"
                                        labelLine={false}
                                        onMouseEnter={(_, index) => setActiveIndex(index)}
                                        onMouseLeave={() => setActiveIndex(null)}
                                        label={(entry) => {
                                            if (entry.value < 2) return "";
                                            return (
                                                <text
                                                    x={entry.x}
                                                    y={entry.y}
                                                    fill={entry.payload.color}
                                                    textAnchor={entry.x > entry.cx ? "start" : "end"}
                                                    dominantBaseline="central"
                                                    className="text-xs font-semibold"
                                                >
                                                    {`${Number(entry.value).toFixed(2)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={entry.color}
                                                opacity={activeIndex === null || (activeIndex === index) ? 1 : 0.3}
                                                className="transition-opacity duration-300"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Premium Legend Panel */}
                        <div className="w-[180px] shrink-0 flex flex-col justify-center gap-3 pl-2">
                            {data.map((item) => {
                                const isHovered = activeIndex !== null && chartData[activeIndex]?.name === item.name;
                                const hasHover = activeIndex !== null;
                                const barWidth = Math.min(item.value, 100);

                                return (
                                    <div
                                        key={item.name}
                                        className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
                                        style={{
                                            opacity: hasHover ? (isHovered ? 1 : 0.35) : 1,
                                            transform: isHovered ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                                            boxShadow: isHovered
                                                ? `0 8px 24px -4px ${item.color}40, 0 0 0 1.5px ${item.color}`
                                                : `0 1px 4px 0 ${item.color}20, 0 0 0 1px ${item.color}30`,
                                            background: isHovered
                                                ? `linear-gradient(135deg, ${item.color}18 0%, ${item.color}08 100%)`
                                                : `linear-gradient(135deg, ${item.color}0D 0%, transparent 100%)`,
                                        }}
                                        onMouseEnter={() => {
                                            const chartIdx = chartData.findIndex(d => d.name === item.name);
                                            if (chartIdx !== -1) setActiveIndex(chartIdx);
                                        }}
                                        onMouseLeave={() => setActiveIndex(null)}
                                    >
                                        {/* Left accent bar */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl transition-all duration-300"
                                            style={{
                                                backgroundColor: item.color,
                                                opacity: isHovered ? 1 : 0.6,
                                            }}
                                        />

                                        <div className="pl-4 pr-3 pt-2.5 pb-2">
                                            {/* Top row: dot + name + percentage */}
                                            <div className="flex items-center gap-2 mb-1.5">
                                                {/* Pulsing dot */}
                                                <span className="relative shrink-0 w-2 h-2">
                                                    <span
                                                        className="absolute inset-0 rounded-full animate-ping opacity-40"
                                                        style={{ backgroundColor: item.color, animationDuration: isHovered ? '1s' : '2s' }}
                                                    />
                                                    <span
                                                        className="relative block w-2 h-2 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                </span>

                                                <span className="text-[11px] font-semibold text-foreground flex-1 leading-tight">
                                                    {item.name}
                                                </span>

                                                <span
                                                    className="text-sm font-black tabular-nums leading-none"
                                                    style={{ color: item.color }}
                                                >
                                                    {item.value.toFixed(1)}%
                                                </span>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="h-1 rounded-full bg-muted/40 overflow-hidden mb-1.5">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700 ease-out"
                                                    style={{
                                                        width: `${barWidth}%`,
                                                        background: `linear-gradient(90deg, ${item.color}99, ${item.color})`,
                                                    }}
                                                />
                                            </div>

                                            {/* Count chip */}
                                            {item.count !== null && item.total !== null && (
                                                <div className="flex items-center justify-end">
                                                    <span
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
                                                        style={{
                                                            backgroundColor: `${item.color}18`,
                                                            color: item.color,
                                                        }}
                                                    >
                                                        {item.count}
                                                        <span className="text-muted-foreground font-medium">/ {item.total} runs</span>
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
