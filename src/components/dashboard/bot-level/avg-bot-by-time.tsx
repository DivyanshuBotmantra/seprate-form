import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
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

interface AvgExecutionTimeData {
    botCode: string;
    date: string;
    avgExecutionTimeMin: number;
}

interface AverageExecutionTimeProps {
    avgExecutionTimeByBot?: AvgExecutionTimeData[];
    dateRange?: {
        from: string;
        to: string;
    };
}

export default function AverageExecutionTime({ avgExecutionTimeByBot, dateRange }: AverageExecutionTimeProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const safeData = avgExecutionTimeByBot ?? [];

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
                    avgExecutionTimeMin: dayData ? dayData.avgExecutionTimeMin : 0,
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
        normalizedData = safeData.map((item) => ({
            ...item,
            displayDate: format(new Date(item.date), "MMM dd"),
        }));
    }

    const formattedData = normalizedData;

    // First 7 days for main view
    const mainViewData = useMemo(() => formattedData.slice(0, 7), [formattedData]);
    const hasMoreData = formattedData.length > 7;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg shadow-lg p-3" style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}>
                    <p className="text-xs font-semibold mb-1">
                        {format(new Date(payload[0].payload.date), "MMM dd, yyyy")}
                    </p>
                    <p className="text-xs" style={{ color: STATUS_COLORS.initiated }}>
                        Avg Time: <span className="font-bold">{payload[0].value.toFixed(2)} min</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    // Reusable chart component
    const RuntimeChart = ({ data: chartData, isDialog = false }: { data: any[]; isDialog?: boolean }) => (
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
                        value: "Execution (Min)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 12, textAnchor: "middle", fill: CHART_UI.axis }
                    }}
                />

                <Tooltip content={<CustomTooltip />} cursor={false} />

                <Bar
                    dataKey="avgExecutionTimeMin"
                    fill={STATUS_COLORS.initiated}
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
                        Bot Run Time
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Daily Bot Run time (minutes)</p>
                </div>

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
                                    Complete Bot Runtime History ({formattedData.length} Days)
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 pt-6">
                                <RuntimeChart data={formattedData} isDialog={true} />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {safeData.length === 0 ? (
                    <EmptyState />
                ) : (
                    <RuntimeChart data={mainViewData} />
                )}
            </div>
        </Card>
    );
}