import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
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

interface BotExecutionTrendData {
    date: string;
    succeeded: number;
    failed: number;
}

interface DetailsStatusGraphProps {
    data?: BotExecutionTrendData[];
    dateRange?: {
        from: string;
        to: string;
    };
}

export default function ExecutionStatusGraph({ data, dateRange }: DetailsStatusGraphProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const safeData = (data && data.length > 0) ? data : [];

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
                    succeeded: dayData ? dayData.succeeded : 0,
                    failed: dayData ? dayData.failed : 0,
                };
            });
        } catch (error) {
            console.error("Error generating date range:", error);
            normalizedData = safeData.map(item => ({
                ...item,
                displayDate: format(new Date(item.date), "MMM dd"),
            }));
        }
    } else {
        normalizedData = safeData
            .filter((item) => item.date && !isNaN(new Date(item.date).getTime()))
            .map((item) => ({
                ...item,
                displayDate: format(new Date(item.date), "MMM dd"),
            }));
    }

    const formattedData = normalizedData;

    // First 7 days for main view
    const mainViewData = useMemo(() => formattedData.slice(0, 7), [formattedData]);
    const hasMoreData = formattedData.length > 7;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const date = payload[0].payload.date;
            const displayDate = payload[0].payload.displayDate;
            const validDate = date && !isNaN(new Date(date).getTime());
            const fullDate = displayDate === "Overall" ? "Overall Summary" : (validDate ? format(new Date(date), "MMM dd, yyyy") : label);

            return (
                <div className="rounded-xl shadow-2xl p-4 border border-white/10 backdrop-blur-md"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}>
                    <p className="text-[13px] font-bold mb-3 border-b border-white/5 pb-2">{fullDate}</p>
                    <div className="space-y-2.5">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[11px] font-semibold opacity-90 whitespace-nowrap">{entry.name}</span>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/5" style={{ color: entry.color }}>
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

    // Reusable chart component
    const StatusChart = ({ data: chartData, isDialog = false }: { data: any[]; isDialog?: boolean }) => (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: 10, bottom: 24 }}
                barCategoryGap={isDialog ? "10%" : "20%"}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} />

                <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12 }}
                    stroke={CHART_UI.axis}
                    angle={isDialog ? -35 : 0}
                    textAnchor={isDialog ? "end" : "middle"}
                    height={isDialog ? 50 : 30}
                    interval={0}
                    label={!isDialog ? {
                        value: "Date",
                        position: "insideBottom",
                        offset: -10,
                        style: { fontSize: 12, fill: CHART_UI.axis }
                    } : undefined}
                />

                <YAxis
                    tick={{ fontSize: 12 }}
                    stroke={CHART_UI.axis}
                    allowDecimals={false}
                    label={{
                        value: "Count",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 12, textAnchor: "middle", fill: CHART_UI.axis }
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
                    radius={[0, 0, 4, 4]}
                    isAnimationActive={false}
                />

                <Bar
                    dataKey="failed"
                    name="Failed"
                    stackId="a"
                    fill={STATUS_COLORS.failed}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                />
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <Card className="h-full p-3 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="mb-1.5 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                        Execution Status Details
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Daily success vs failure ratio</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Legend */}
                    {safeData.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: STATUS_COLORS.succeeded }}></span>
                                <span className="text-[10px] font-medium text-foreground">Succeeded</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: STATUS_COLORS.failed }}></span>
                                <span className="text-[10px] font-medium text-foreground">Failed</span>
                            </div>
                        </div>
                    )}

                    {/* Eye button — only when more than 7 days */}
                    {hasMoreData && safeData.length > 0 && (
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
                                        Complete Execution Status History ({formattedData.length} Days)
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 pt-6">
                                    <StatusChart data={formattedData} isDialog={true} />
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {safeData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <StatusChart data={mainViewData} />
                )}
            </div>
        </Card>
    );
}