import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LabelList, Label } from "recharts";
import { format, eachDayOfInterval, isSameDay, startOfDay } from "date-fns";
import { CHART_UI } from "@/components/dashboard/colors";
import EmptyState from "@/components/common/EmptyState";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";
import { useMemo } from "react";

interface MachineDetail {
    machineName: string;
    totalMinutes: number;
}

interface DailyTrendData {
    date: string;
    details: MachineDetail[];
}

interface MachineUtilizationProps {
    data?: DailyTrendData[];
    dateRange?: {
        from: string;
        to: string;
    };
}

const MACHINE_COLORS = [
    '#8B5CF6', // Violet
    '#F43F5E', // Rose
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#06B6D4', // Cyan
];

export default function MachineUtilization({ data, dateRange }: MachineUtilizationProps) {
    const safeData = data || [];
    const [hoveredMachine, setHoveredMachine] = useState<string | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // 1. First pass: Collect all unique machines from all dates
    const machines = new Set<string>();
    safeData.forEach(item => {
        item.details.forEach(detail => {
            machines.add(detail.machineName);
        });
    });
    const machineList = Array.from(machines);

    // 2. Second pass: Transform data for stacked bar chart
    let chartData: any[] = [];

    if (dateRange && dateRange.from && dateRange.to) {
        try {
            const start = startOfDay(new Date(dateRange.from.replace(' ', 'T')));
            const end = startOfDay(new Date(dateRange.to.replace(' ', 'T')));

            const allDays = eachDayOfInterval({ start, end });

            chartData = allDays.map(day => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dataPoint: any = {
                    date: dateKey,
                    displayDate: format(day, "MMM dd"),
                };

                // Initialize all machines with 0
                machineList.forEach(machine => {
                    dataPoint[machine] = 0;
                });

                // Find data for this day
                const matchingItem = safeData.find(item =>
                    isSameDay(new Date(item.date.replace(' ', 'T')), day)
                );

                if (matchingItem) {
                    matchingItem.details.forEach(detail => {
                        dataPoint[detail.machineName] = detail.totalMinutes;
                    });
                }

                return dataPoint;
            });
        } catch (error) {
            console.error("Error generating date range for MachineUtilization:", error);
        }
    }

    if (chartData.length === 0) {
        chartData = safeData.map(item => {
            const dataPoint: any = {
                date: item.date,
                displayDate: format(new Date(item.date), "MMM dd"),
            };

            // Initialize all machines with 0
            machineList.forEach(machine => {
                dataPoint[machine] = 0;
            });

            // Fill in actual values from details
            item.details.forEach(detail => {
                dataPoint[detail.machineName] = detail.totalMinutes;
            });

            return dataPoint;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }

    // ✅ Check if there's no data to display
    const hasData = chartData.length > 0 && machineList.length > 0;

    // Limit to 7 days for the main view
    const mainViewData = useMemo(() => {
        return chartData.slice(0, 7);
    }, [chartData]);

    const hasMoreData = hasData && chartData.length > 7;
    const CustomTooltip = ({ active, payload, label }: any) => {
        // Filter out zero values to keep tooltip clean, but only if there are non-zero values
        const activePayload = payload?.filter((entry: any) => entry.value > 0) || [];

        if (active && activePayload.length) {
            const dateStr = activePayload[0].payload.date;
            const fullDate = dateStr ? format(new Date(dateStr), "MMM dd, yyyy") : label;

            return (
                <div className="rounded-xl shadow-2xl p-4 border border-white/10 backdrop-blur-md"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}>
                    <p className="text-[13px] font-bold mb-3 border-b border-white/5 pb-2">{fullDate}</p>
                    <div className="space-y-2.5">
                        {activePayload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between gap-10">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[11px] font-semibold opacity-90 whitespace-nowrap">{entry.name}</span>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-white/5" style={{ color: entry.color }}>
                                    {entry.value.toFixed(1)}m
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Machine Utilization Bot- wise Daily
                    </h3>
                </div>

                <div className="flex items-center gap-4">
                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
                        {machineList.map((machine, index) => (
                            <div
                                key={machine}
                                className="flex items-center gap-2 group cursor-pointer"
                                onMouseEnter={() => setHoveredMachine(machine)}
                                onMouseLeave={() => setHoveredMachine(null)}
                            >
                                <div
                                    className="w-3 h-3 rounded-sm shadow-sm transition-all duration-300 group-hover:scale-125"
                                    style={{
                                        backgroundColor: MACHINE_COLORS[index % MACHINE_COLORS.length],
                                        opacity: hoveredMachine ? (hoveredMachine === machine ? 1 : 0.3) : 1
                                    }}
                                ></div>
                                <span
                                    className="text-[10px] font-bold transition-all duration-300 whitespace-nowrap"
                                    style={{
                                        color: hoveredMachine ? (hoveredMachine === machine ? 'inherit' : 'gray') : 'inherit',
                                        opacity: hoveredMachine ? (hoveredMachine === machine ? 1 : 0.5) : 1
                                    }}
                                >
                                    {machine}
                                </span>
                            </div>
                        ))}
                    </div>

                    {hasMoreData && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="h-8 w-8 flex items-center justify-center rounded-full bg-sidebar/50 hover:bg-btn-primary/10 text-muted-foreground hover:text-btn-primary transition-all duration-300 border border-border shadow-sm group shrink-0">
                                    <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                                </button>
                            </DialogTrigger>
                            <DialogContent className="min-w-6xl w-full h-[85vh] flex flex-col">
                                <DialogHeader className="pb-4 border-b border-border">
                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                        <span className="w-1.5 h-8 bg-btn-primary rounded-full"></span>
                                        Complete Machine Utilization History ({chartData.length} Days)
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 min-h-0 pt-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 12, right: 12, left: 10, bottom: 24 }} barSize={50}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} />
                                            <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} stroke={CHART_UI.axis} />
                                            <YAxis tick={{ fontSize: 12 }} stroke={CHART_UI.axis} />
                                            <Tooltip content={<CustomTooltip />} cursor={false} />
                                            {machineList.map((machine, index) => (
                                                <Bar key={machine} dataKey={machine} name={machine} stackId="a" fill={MACHINE_COLORS[index % MACHINE_COLORS.length]} />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            <div className="flex-1 min-h-0 mt-2">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={mainViewData} margin={{ top: 12, right: 12, left: 10, bottom: 24 }} barSize={50}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 12 }}
                                stroke={CHART_UI.axis}
                                axisLine={false}
                                tickLine={false}
                            >
                                <Label
                                    value="Date"
                                    position="insideBottom"
                                    offset={-10}
                                    style={{ fontSize: 12, fill: CHART_UI.axis }}
                                />
                            </XAxis>
                            <YAxis
                                tick={{ fontSize: 12 }}
                                stroke={CHART_UI.axis}
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 'auto']}
                            >
                                <Label
                                    value="Time (min)"
                                    angle={-90}
                                    position="insideLeft"
                                    style={{ textAnchor: 'middle', fontSize: 12, fill: CHART_UI.axis }}
                                />
                            </YAxis>
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                                shared={true}
                                wrapperStyle={{ outline: 'none' }}
                            />

                            {machineList.map((machine, index) => (
                                <Bar
                                    key={machine}
                                    dataKey={machine}
                                    name={machine}
                                    stackId="a"
                                    fill={MACHINE_COLORS[index % MACHINE_COLORS.length]}
                                    fillOpacity={hoveredMachine ? (hoveredMachine === machine ? 1 : 0.2) : 0.9}
                                    radius={index === machineList.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                    onMouseEnter={() => setHoveredMachine(machine)}
                                    onMouseLeave={() => setHoveredMachine(null)}
                                    className="transition-all duration-300"
                                >
                                    <LabelList
                                        dataKey={machine}
                                        position="center"
                                        formatter={(value: number) => value > 0 ? value.toFixed(1) : ''}
                                        style={{ fill: '#fff', fontSize: 11, fontWeight: 600 }}
                                    />
                                </Bar>
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
