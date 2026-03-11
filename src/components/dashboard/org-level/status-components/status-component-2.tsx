import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { format, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
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

interface BotUsageData {
    date: string;
    total_runs: number;
    bot_name: string;
    status_counts: {
        SUCCEEDED: number;
        FAILED: number;
        "IN-PROGRESS": number;
        INITIATED: number;
    };
    status_percentage: {
        SUCCEEDED: number;
        FAILED: number;
        "IN-PROGRESS": number;
        INITIATED: number;
    };
}

interface StatusComponent2Props {
    bot_usage_per_date?: BotUsageData[];
    dateRange?: {
        from: string;
        to: string;
    };
}

export default function StatusComponent2({ bot_usage_per_date = [], dateRange }: StatusComponent2Props) {
    const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const safeData = bot_usage_per_date && bot_usage_per_date.length > 0 ? bot_usage_per_date : [];

    let normalizedData = [];

    if (dateRange && dateRange.from && dateRange.to) {
        try {
            const start = startOfDay(new Date(dateRange.from.replace(' ', 'T')));
            const end = startOfDay(new Date(dateRange.to.replace(' ', 'T')));

            const allDays = eachDayOfInterval({ start, end });

            normalizedData = allDays.map(day => {
                const dayData = safeData.find(item => {
                    const itemDate = startOfDay(new Date(item.date.replace(' ', 'T')));
                    return isSameDay(day, itemDate);
                });

                return {
                    date: format(day, "yyyy-MM-dd"),
                    displayDate: format(day, "MMM dd"),
                    succeeded: dayData ? dayData.status_counts.SUCCEEDED : 0,
                    failed: dayData ? dayData.status_counts.FAILED : 0,
                    inProgress: dayData ? dayData.status_counts["IN-PROGRESS"] : 0,
                    initiated: dayData ? dayData.status_counts.INITIATED : 0,
                    botName: dayData ? dayData.bot_name : "",
                    totalRuns: dayData ? dayData.total_runs : 0,
                };
            });
        } catch (error) {
            console.error("Error generating date range:", error);
            normalizedData = safeData.map(item => ({
                date: item.date,
                displayDate: format(new Date(item.date), "MMM dd"),
                succeeded: item.status_counts.SUCCEEDED,
                failed: item.status_counts.FAILED,
                inProgress: item.status_counts["IN-PROGRESS"],
                initiated: item.status_counts.INITIATED,
                botName: item.bot_name,
                totalRuns: item.total_runs,
            }));
        }
    } else {
        normalizedData = safeData.map(item => ({
            date: item.date,
            displayDate: format(new Date(item.date), "MMM dd"),
            succeeded: item.status_counts.SUCCEEDED,
            failed: item.status_counts.FAILED,
            inProgress: item.status_counts["IN-PROGRESS"],
            initiated: item.status_counts.INITIATED,
            botName: item.bot_name,
            totalRuns: item.total_runs,
        }));
    }

    const chartData = normalizedData;
    const isDataEmpty = safeData.length === 0;

    // Limit to first 7 days for main view
    const mainViewData = useMemo(() => chartData.slice(0, 7), [chartData]);
    const hasMoreData = chartData.length > 7;

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const fullDate = format(new Date(data.date), "MMM dd, yyyy");

            return (
                <div
                    className="rounded-lg shadow-xl p-3 border"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="text-xs font-bold mb-2 text-center border-b border-white/10 pb-1.5">{fullDate}</p>
                    <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] font-medium whitespace-nowrap">{entry.name}</span>
                                </div>
                                <span className="text-[10px] font-bold" style={{ color: entry.color }}>
                                    {entry.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Reusable chart — same pattern as machine-component-2
    const DailyChart = ({ data, isDialog = false }: { data: any[]; isDialog?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={data}
                margin={{ top: 12, right: 12, left: 10, bottom: 24 }}
                barCategoryGap={isDialog ? "10%" : "20%"}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} />

                <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11 }}
                    stroke={CHART_UI.axis}
                    angle={isDialog ? -35 : 0}
                    textAnchor={isDialog ? "end" : "middle"}
                    height={isDialog ? 50 : 30}
                    interval={0}
                    label={!isDialog ? {
                        value: "Date",
                        position: "insideBottom",
                        offset: -10,
                        style: { fontSize: 11, fill: CHART_UI.axis }
                    } : undefined}
                />

                <YAxis
                    tick={{ fontSize: 11 }}
                    stroke={CHART_UI.axis}
                    allowDecimals={false}
                    label={{
                        value: "Executions",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, textAnchor: "middle", fill: CHART_UI.axis }
                    }}
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
                    fillOpacity={hoveredStatus ? (hoveredStatus === 'Succeeded' ? 1 : 0.3) : 0.9}
                    radius={[0, 0, 0, 0]}
                    isAnimationActive={false}
                    onMouseEnter={() => setHoveredStatus('Succeeded')}
                    onMouseLeave={() => setHoveredStatus(null)}
                />

                <Bar
                    dataKey="failed"
                    name="Failed"
                    stackId="a"
                    fill={STATUS_COLORS.failed}
                    fillOpacity={hoveredStatus ? (hoveredStatus === 'Failed' ? 1 : 0.3) : 0.9}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                    onMouseEnter={() => setHoveredStatus('Failed')}
                    onMouseLeave={() => setHoveredStatus(null)}
                />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-[95%] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Day-wise Status Distribution
                    </h3>
                </div>

                <div className="flex items-center gap-3">
                    {/* Legend */}
                    {!isDataEmpty && (
                        <div className="flex items-center gap-4">
                            <div
                                className="flex items-center gap-1.5 cursor-pointer group"
                                onMouseEnter={() => setHoveredStatus('Succeeded')}
                                onMouseLeave={() => setHoveredStatus(null)}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded shadow-sm transition-transform group-hover:scale-125"
                                    style={{
                                        backgroundColor: STATUS_COLORS.succeeded,
                                        opacity: hoveredStatus ? (hoveredStatus === 'Succeeded' ? 1 : 0.3) : 1
                                    }}
                                ></span>
                                <span
                                    className="text-[10px] font-bold transition-colors"
                                    style={{
                                        color: hoveredStatus ? (hoveredStatus === 'Succeeded' ? 'inherit' : 'gray') : 'inherit',
                                        opacity: hoveredStatus ? (hoveredStatus === 'Succeeded' ? 1 : 0.5) : 1
                                    }}
                                >
                                    Succeeded
                                </span>
                            </div>
                            <div
                                className="flex items-center gap-1.5 cursor-pointer group"
                                onMouseEnter={() => setHoveredStatus('Failed')}
                                onMouseLeave={() => setHoveredStatus(null)}
                            >
                                <span
                                    className="w-2.5 h-2.5 rounded shadow-sm transition-transform group-hover:scale-125"
                                    style={{
                                        backgroundColor: STATUS_COLORS.failed,
                                        opacity: hoveredStatus ? (hoveredStatus === 'Failed' ? 1 : 0.3) : 1
                                    }}
                                ></span>
                                <span
                                    className="text-[10px] font-bold transition-colors"
                                    style={{
                                        color: hoveredStatus ? (hoveredStatus === 'Failed' ? 'inherit' : 'gray') : 'inherit',
                                        opacity: hoveredStatus ? (hoveredStatus === 'Failed' ? 1 : 0.5) : 1
                                    }}
                                >
                                    Failed
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Eye button — only when more than 7 days */}
                    {hasMoreData && !isDataEmpty && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0 border border-border shadow-sm group">
                                    <Eye className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="min-w-6xl w-full h-[85vh] flex flex-col">
                                <DialogHeader className="pb-4 border-b border-border">
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <span className="w-1.5 h-8 bg-btn-primary rounded-full"></span>
                                        Complete Day-wise Status History ({chartData.length} Days)
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 pt-6">
                                    <DailyChart data={chartData} isDialog={true} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {isDataEmpty ? (
                    <EmptyState />
                ) : (
                    <DailyChart data={mainViewData} />
                )}
            </div>
        </div>
    );
}

