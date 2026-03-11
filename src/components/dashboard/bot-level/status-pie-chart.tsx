import React from "react";
import { Card } from "@/components/ui/card";
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

interface StatusPieChartProps {
    summaryIndexPercentage?: SummaryIndexPercentage;
}

export default function StatusPieChart({ summaryIndexPercentage }: StatusPieChartProps) {
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
        { name: "Initiated", value: safeSummary.initiated, color: STATUS_COLORS.initiated },
        { name: "In-Progress", value: safeSummary.inProgress, color: STATUS_COLORS.inProgress },
        { name: "Succeeded", value: safeSummary.succeeded, color: STATUS_COLORS.succeeded },
        { name: "Failed", value: safeSummary.failed, color: STATUS_COLORS.failed },
    ];

    const chartData = data.filter((item) => item.value > 0);
    const COLORS = [STATUS_COLORS.initiated, STATUS_COLORS.inProgress, STATUS_COLORS.succeeded, STATUS_COLORS.failed];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div
                    className="rounded-lg shadow-lg p-2 text-xs"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="font-semibold">{payload[0].name}</p>
                    <p style={{ opacity: 0.8 }}>
                        {Number(payload[0].value).toFixed(1)}%
                    </p>
                </div>
            );
        }
        return null;
    };

    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    return (
        <Card className="p-3 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="mb-1">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                    Status Distribution
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Distribution by status</p>
            </div>

            <div className="flex-1 min-h-0">
                {isDataEmpty ? (
                    <EmptyState />
                ) : (
                    <div className="flex items-center h-full gap-4">
                        <div
                            className="flex-1 h-full"
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
                                                    {`${Number(entry.value).toFixed(1)}%`}
                                                </text>
                                            );
                                        }}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={COLORS[data.findIndex(d => d.name === entry.name)]}
                                                opacity={activeIndex === null || activeIndex === index ? 1 : 0.5}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="w-[160px] shrink-0 flex flex-col justify-center gap-1.5 pl-2">
                            {data.map((item) => (
                                <div
                                    key={item.name}
                                    className="flex items-center gap-2 px-2 py-1 rounded border-2 text-xs"
                                    style={{ borderColor: `color-mix(in srgb, ${item.color}, transparent 50%)` }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-muted-foreground">{item.name}</span>
                                    <span className="font-medium text-xs" style={{ color: item.color }}>
                                        {item.value.toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
