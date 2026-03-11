import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_COLORS, CHART_UI } from "@/components/dashboard/colors";
import EmptyState from "@/components/common/EmptyState";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface OverallStatusPercentage {
    bot_name: string;
    status_percentage: {
        SUCCEEDED: number | string;  // Can be number or string from API
        FAILED: number | string;
        "IN-PROGRESS": number | string;
        INITIATED: number | string;
    };
}

interface SummaryIndex {
    totalExecutions: number;
    inProgress: number;
    succeeded: number;
    failed: number;
    initiated: number;
}

interface StatusComponent4Props {
    overall_status_percentage?: OverallStatusPercentage[];
    summaryIndex?: SummaryIndex;
}

export default function StatusComponent4({ overall_status_percentage = [], summaryIndex }: StatusComponent4Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    // Transform data for the chart - convert to numbers (handles both number and string types)
    const chartData: Array<{
        name: string;
        displayName: string;
        succeeded: number;
        failed: number;
        inProgress: number;
        initiated: number;
    }> = overall_status_percentage.map(item => ({
        name: item.bot_name,
        // Truncate long bot names for Y-axis display
        displayName: item.bot_name.length > 15 ? item.bot_name.substring(0, 15) + '...' : item.bot_name,
        succeeded: Number(item.status_percentage.SUCCEEDED),
        failed: Number(item.status_percentage.FAILED),
        inProgress: Number(item.status_percentage["IN-PROGRESS"]),
        initiated: Number(item.status_percentage.INITIATED),
    }));

    const isDataEmpty = chartData.length === 0;

    // Get top 3 bots by total executions (sum of all statuses)
    const top3Data = [...chartData]
        .sort((a, b) => {
            const totalA = a.succeeded + a.failed + a.inProgress + a.initiated;
            const totalB = b.succeeded + b.failed + b.inProgress + b.initiated;
            return totalB - totalA;
        })
        .slice(0, 3);

    const hasMoreData = chartData.length > 3;

    // Custom Y-axis tick - no rotation, truncated text
    const CustomYAxisTick = ({ x, y, payload }: any) => {
        return (
            <g transform={`translate(${x},${y})`}>
                <text
                    x={0}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill={CHART_UI.axis}
                    fontSize={10}
                    fontWeight={600}
                >
                    {payload.value}
                </text>
            </g>
        );
    };

    // Custom Tooltip with full bot name
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const totalExecutions = summaryIndex?.totalExecutions;

            return (
                <div
                    className="rounded-lg shadow-xl p-3 border border-white/10"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="text-xs font-bold mb-2 text-center border-b border-white/10 pb-1.5">{data.name}</p>

                    {/* Total Executions badge — sits naturally above the status rows */}
                    {totalExecutions !== undefined && (
                        <div className="flex items-center justify-center mb-2">
                            <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide"
                                style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)' }}
                            >
                                <span className="opacity-60">Total</span>
                                <span className="font-black text-white">{totalExecutions}</span>
                                <span className="opacity-60">executions</span>
                            </span>
                        </div>
                    )}

                    <div className="space-y-1">
                        {[...payload].reverse().map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] font-medium whitespace-nowrap">{entry.name}</span>
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: entry.color }}>
                                    {entry.value.toFixed(2)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Custom Bar Label - Returns a render function that knows its dataKey
    const renderLabel = (dataKey: string) => (props: any): any => {
        const { x, y, width, height, payload } = props;

        // value is the actual value for this specific bar segment
        if (!payload || payload[dataKey] === undefined) return null;

        const segmentValue = Number(payload[dataKey]);

        // Only show label if segment value is > 0 and segment is wide enough to fit the text
        if (segmentValue < 1 || width < 45) return null;

        return (
            <text
                x={x + width / 2}
                y={y + height / 2}
                fill="white"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight="bold"
            >
                {segmentValue.toFixed(2)}%
            </text>
        );
    };

    // Chart Component (reusable for both main view and dialog)
    const BotPerformanceChart = ({ data, height = "100%", yAxisWidth = 70 }: { data: any[], height?: string | number, yAxisWidth?: number }) => {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 12, right: 24, left: 15, bottom: 24 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} opacity={0.3} />

                    <XAxis
                        type="number"
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fontWeight: 600 }}
                        stroke={CHART_UI.axis}
                        axisLine={false}
                        tickLine={false}
                        label={{
                            value: "Percentage (%)",
                            position: "insideBottom",
                            offset: -8,
                            style: { fontSize: 11, fill: CHART_UI.axis, fontWeight: 600 }
                        }}
                    />

                    <YAxis
                        type="category"
                        dataKey="displayName"
                        tick={<CustomYAxisTick />}
                        stroke={CHART_UI.axis}
                        width={yAxisWidth}
                        axisLine={false}
                        tickLine={false}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        wrapperStyle={{ outline: "none" }}
                    />
                    <Bar
                        dataKey="succeeded"
                        name="Succeeded"
                        stackId="a"
                        fill={STATUS_COLORS.succeeded}
                        fillOpacity={0.9}
                        barSize={30}
                        label={renderLabel('succeeded')}
                    />

                    <Bar
                        dataKey="failed"
                        name="Failed"
                        stackId="a"
                        fill={STATUS_COLORS.failed}
                        fillOpacity={0.9}
                        barSize={30}
                        radius={[0, 4, 4, 0]}
                        label={renderLabel('failed')}
                    />
                </BarChart>
            </ResponsiveContainer>
        );
    };

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-[100%] flex flex-col">
            <div className="mb-4 flex items-start justify-between">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Bot Performance Overview
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-1 ml-3 font-medium">
                        {hasMoreData ? 'Top 3 bots - status distribution' : 'Status distribution by bot name'}
                    </p>
                </div>
                {!isDataEmpty && (
                    <div className="flex items-center gap-2">
                        {/* Status Legend */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 group">
                                <span
                                    className="w-2.5 h-2.5 rounded shadow-sm transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: STATUS_COLORS.succeeded }}
                                ></span>
                                <span className="text-[10px] font-bold">
                                    Succeeded
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 group">
                                <span
                                    className="w-2.5 h-2.5 rounded shadow-sm transition-transform group-hover:scale-110"
                                    style={{ backgroundColor: STATUS_COLORS.failed }}
                                ></span>
                                <span className="text-[10px] font-bold">
                                    Failed
                                </span>
                            </div>
                        </div>

                        {/* Eye Icon for Dialog */}
                        {hasMoreData && (
                            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0">
                                        <Eye className="h-4 w-4" />
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="min-w-6xl max-h-[90vh]">
                                    <DialogHeader>
                                        <div className="flex items-center justify-between">
                                            <DialogTitle>All Bots Performance ({chartData.length})</DialogTitle>
                                            {/* Status Legend in Dialog */}
                                            <div className="flex items-center gap-4 mr-8">
                                                <div className="flex items-center gap-2 group">
                                                    <span
                                                        className="w-3 h-3 rounded shadow-sm transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: STATUS_COLORS.succeeded }}
                                                    ></span>
                                                    <span className="text-xs font-bold">
                                                        Succeeded
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 group">
                                                    <span
                                                        className="w-3 h-3 rounded shadow-sm transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: STATUS_COLORS.failed }}
                                                    ></span>
                                                    <span className="text-xs font-bold">
                                                        Failed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </DialogHeader>

                                    <div className="flex items-start gap-4 p-2">
                                        {/* Full Chart */}
                                        <div className="w-full h-[500px]">
                                            <BotPerformanceChart data={chartData} height="100%" yAxisWidth={120} />
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {isDataEmpty ? (
                    <EmptyState />
                ) : (
                    <BotPerformanceChart data={top3Data} yAxisWidth={100} />
                )}
            </div>
        </div>
    );
}
