import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { CHART_UI } from '@/components/dashboard/colors';
import EmptyState from '@/components/common/EmptyState';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Eye } from "lucide-react";

interface MachineComponent2Props {
    machineUtilization?: Array<{
        date: string;
        machine_name: string;
        time: string;
        percentage_usage_for_that_day: string;
    }>;
    machineColors: Map<string, string>;
    dateRange?: { from: string; to: string };
}

export default function MachineComponent2({ machineUtilization, machineColors, dateRange }: MachineComponent2Props) {
    const [dialogOpen, setDialogOpen] = useState(false);

    // Check if data exists
    const hasData = machineUtilization && machineUtilization.length > 0;

    // Process data for Time Usage chart (Date vs Time) - Stacked by Machine
    const timeUsageResult = useMemo(() => {
        if (!hasData && !dateRange) return { data: [], machines: [] };

        // Group by date and machine
        const dateMap = new Map<string, Map<string, number>>();
        const allMachines = new Set<string>();

        if (hasData) {
            machineUtilization!.forEach(item => {
                if (!dateMap.has(item.date)) {
                    dateMap.set(item.date, new Map<string, number>());
                }
                const timeValue = parseFloat((item.time || '0').replace(' min', '')) / 60;
                dateMap.get(item.date)!.set(item.machine_name, timeValue);
                allMachines.add(item.machine_name);
            });
        }

        // Determine timeline bounds
        let startBound: Date;
        let endBound: Date;

        if (dateRange?.from && dateRange?.to) {
            startBound = startOfDay(parseISO(dateRange.from));
            endBound = startOfDay(parseISO(dateRange.to));
        } else if (hasData) {
            const sortedDates = Array.from(dateMap.keys()).sort();
            startBound = startOfDay(parseISO(sortedDates[0]));
            endBound = startOfDay(parseISO(sortedDates[sortedDates.length - 1]));
        } else {
            return { data: [], machines: [] };
        }

        // Generate all days in the range to fill gaps
        const allDaysInRange = eachDayOfInterval({
            start: startBound,
            end: endBound
        });

        const machineList = Array.from(allMachines).sort();

        return {
            data: allDaysInRange.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const machineData = dateMap.get(dateStr);
                const entry: any = {
                    date: dateStr,
                    displayDate: format(day, 'MMM dd'),
                };

                // Add each machine's time to the entry
                machineList.forEach(machine => {
                    entry[machine] = machineData?.get(machine) || 0;
                });

                return entry;
            }),
            machines: machineList,
        };
    }, [hasData, machineUtilization, dateRange]);

    const timeData = timeUsageResult?.data || [];
    const machines = timeUsageResult?.machines || [];

    // Limit to 7 days for the main view ONLY IF we don't have a specific date range
    // Or if the range is very large. But usually, if a range is picked, show it.
    const mainViewData = useMemo(() => {
        // If we have a range, show the whole thing in the main view (up to a reasonable limit)
        // For UI consistency with the eye button, we'll still keep the 7-day slice for the main view
        // so the user has to click the eye to see the full custom range if it's > 7 days.
        return timeData.slice(0, 7);
    }, [timeData]);

    const hasMoreData = timeData.length > 7;

    // Custom Tooltip for Time Usage
    const TimeUsageTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const totalTime = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

            // Sort payload by value descending
            const sortedPayload = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0));

            return (
                <div
                    className="rounded-lg shadow-xl p-3 border min-w-[200px]"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="text-xs font-bold mb-2 border-b border-white/10 pb-1.5">
                        {format(parseISO(data.date), 'MMM dd, yyyy')}
                    </p>
                    <div className="space-y-1.5 mb-2">
                        {sortedPayload.map((entry: any, index: number) => (
                            entry.value > 0 && (
                                <div key={index} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: entry.fill }}
                                        />
                                        <span className="text-[10px] font-medium truncate max-w-[140px]">
                                            {entry.name.split('.')[0]}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ color: entry.fill }}>
                                        {entry.value.toFixed(2)} hrs
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                    <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-white/10">
                        <span className="text-[10px] font-bold">Total:</span>
                        <span className="text-[10px] font-bold text-blue-400">{totalTime.toFixed(2)} hrs</span>
                    </div>
                </div>
            );
        }
        return null;
    };

    // Reusable Chart Component
    const RuntimeChart = ({ data, height = "100%", isDialog = false }: { data: any[], height?: string | number, isDialog?: boolean }) => (
        <ResponsiveContainer width="100%" height={height}>
            <BarChart
                data={data}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                barCategoryGap={isDialog ? "10%" : "20%"}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} opacity={0.5} />
                <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 10, fill: CHART_UI.axis, fontWeight: 500 }}
                    stroke={CHART_UI.axis}
                    angle={-35}
                    textAnchor="end"
                    height={50}
                    interval={0}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: CHART_UI.axis, fontWeight: 500 }}
                    stroke={CHART_UI.axis}
                    width={40}
                    domain={[0, 'auto']}
                    axisLine={false}
                    tickLine={false}
                    label={{
                        value: 'Time (hrs)',
                        angle: -90,
                        position: 'insideLeft',
                        offset: 5,
                        style: {
                            fontSize: 10,
                            textAnchor: 'middle',
                            fill: CHART_UI.axis,
                            fontWeight: 600
                        }
                    }}
                />
                <Tooltip
                    content={<TimeUsageTooltip />}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    wrapperStyle={{ outline: 'none' }}
                />
                {/* Stacked bars for each machine */}
                {machines.map((machine: string) => (
                    <Bar
                        key={machine}
                        dataKey={machine}
                        fill={machineColors.get(machine) || '#3b82f6'}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth={0.5}
                        stackId="a"
                    />
                ))}
            </BarChart>
        </ResponsiveContainer>
    );

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Day Wise Machine Runtime
                    </h3>
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
                                    Complete Machine Runtime History ({timeData.length} Days)
                                </DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 min-h-0 pt-6">
                                <RuntimeChart data={timeData} height="100%" isDialog={true} />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0 relative">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <div className="absolute inset-0">
                        <RuntimeChart data={mainViewData} />
                    </div>
                )}
            </div>
        </div>
    );
}
