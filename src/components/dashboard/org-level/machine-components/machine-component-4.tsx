import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, Cell } from 'recharts';
import { format, parseISO, eachDayOfInterval, startOfDay } from 'date-fns';
import { CHART_UI } from '@/components/dashboard/colors';
import EmptyState from '@/components/common/EmptyState';

interface MachineRuntimeDaily {
    date: string;
    machine_name: string;
    total_runtime_ms: number;
}

interface MachineComponent4Props {
    machineRuntimeDaily?: MachineRuntimeDaily[];
    machineColors: Map<string, string>;
    dateRange?: { from: string; to: string };
}

export default function MachineComponent4({ machineRuntimeDaily, dateRange }: MachineComponent4Props) {
    const hasData = machineRuntimeDaily && machineRuntimeDaily.length > 0;
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Process data for Day Wise Machine Bar Graph (Average Operational vs Idle)
    const { chartData, totalOverallHours, totalOverallMachines } = useMemo(() => {
        if (!hasData && !dateRange) return { chartData: [], totalOverallHours: 0, totalOverallMachines: 0 };

        // 1. Group by date to calculate average per day
        const dateMap = new Map<string, { totalMs: number, machines: Set<string> }>();
        const allMachines = new Set<string>();

        if (hasData) {
            machineRuntimeDaily.forEach(item => {
                if (!dateMap.has(item.date)) {
                    dateMap.set(item.date, { totalMs: 0, machines: new Set() });
                }
                const data = dateMap.get(item.date)!;
                data.totalMs += (item.total_runtime_ms || 0);
                data.machines.add(item.machine_name);
                allMachines.add(item.machine_name);
            });
        }

        // 2. Determine timeline bounds
        let startBound: Date;
        let endBound: Date;

        if (dateRange?.from && dateRange?.to) {
            startBound = startOfDay(parseISO(dateRange.from));
            endBound = startOfDay(parseISO(dateRange.to));
        } else {
            // Fallback to data bounds
            const sortedDates = Array.from(dateMap.keys()).sort();
            startBound = startOfDay(parseISO(sortedDates[0]));
            endBound = startOfDay(parseISO(sortedDates[sortedDates.length - 1]));
        }

        // 3. Generate all days in the range to fill gaps
        const allDaysInRange = eachDayOfInterval({
            start: startBound,
            end: endBound
        });

        const sortedData = allDaysInRange.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = dateMap.get(dateStr);

            if (!data) {
                // Return a zero-data entry (Idle only)
                return {
                    date: dateStr,
                    displayDate: format(day, 'MMM dd'),
                    "Operational Hours": 0,
                    "Idle Hours": 24,
                    machineCount: 0,
                    totalHrs: 0,
                    avgPercentage: 0
                };
            }

            const totalHrs = data.totalMs / (1000 * 60 * 60);
            const machineCount = data.machines.size || 1;
            const avgOperational = totalHrs / machineCount;
            
            return {
                date: dateStr,
                displayDate: format(day, 'MMM dd'),
                "Operational Hours": avgOperational,
                "Idle Hours": Math.max(0, 24 - avgOperational),
                machineCount,
                totalHrs,
                avgPercentage: (avgOperational / 24) * 100
            };
        });

        const overallHrs = Array.from(dateMap.values()).reduce((sum, d) => sum + d.totalMs, 0) / (1000 * 60 * 60);

        return { 
            chartData: sortedData, 
            totalOverallHours: overallHrs,
            totalOverallMachines: allMachines.size
        };
    }, [hasData, machineRuntimeDaily]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const op = data["Operational Hours"];
            const idle = data["Idle Hours"];
            const pct = data.avgPercentage;

            return (
                <div
                    className="rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-4 border border-white/10 backdrop-blur-xl transition-all duration-300 ring-1 ring-white/5"
                    style={{ 
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
                        color: CHART_UI.tooltipText 
                    }}
                >
                    <p className="text-[12px] font-black mb-3 border-b border-white/10 pb-2 flex items-center justify-between">
                        <span className="text-blue-400 tracking-wider">
                            {format(parseISO(data.date), 'MMMM dd, yyyy')}
                        </span>
                    </p>
                    <div className="space-y-3 mb-3">
                        <div className="flex items-center justify-between gap-6 group">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" />
                                <span className="text-[11px] font-bold text-foreground/80">Operational</span>
                            </div>
                            <span className="text-[11px] font-black text-blue-500 tabular-nums">
                                {op.toFixed(2)} hrs <span className="opacity-60 text-[10px] ml-1">({pct.toFixed(1)}%)</span>
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-6 group">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.4)]" />
                                <span className="text-[11px] font-bold text-foreground/80">Idle Time</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-400 tabular-nums">
                                {idle.toFixed(2)} hrs <span className="opacity-60 text-[10px] ml-1">({(100 - pct).toFixed(1)}%)</span>
                            </span>
                        </div>
                    </div>
                    <div className="border-t border-white/5 pt-2.5 mt-1 flex flex-col gap-1.5 overflow-hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Daily Total</span>
                            <span className="text-[10px] font-black text-foreground">{data.totalHrs.toFixed(2)} hrs</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Active Fleet</span>
                            <span className="text-[10px] font-black text-foreground">{data.machineCount} machines</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Day Wise Avg Machine Runtime
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 ml-3 font-medium italic">
                        Average operational vs idle time across {totalOverallMachines} machines
                    </p>
                </div>
                
                {hasData && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Total Combined Hours</span>
                        <span className="text-xl font-black text-btn-primary drop-shadow-sm">
                            {totalOverallHours.toFixed(1)} <span className="text-xs font-bold text-muted-foreground">hrs</span>
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                            barCategoryGap="35%"
                            onMouseMove={(state) => {
                                if (state.activeTooltipIndex !== undefined) {
                                    setActiveIndex(state.activeTooltipIndex);
                                } else {
                                    setActiveIndex(null);
                                }
                            }}
                            onMouseLeave={() => setActiveIndex(null)}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="displayDate"
                                tick={{ fontSize: 9, fill: CHART_UI.axis, fontWeight: 500 }}
                                stroke={CHART_UI.axis}
                                tickMargin={10}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 10, fill: CHART_UI.axis, fontWeight: 600 }}
                                stroke={CHART_UI.axis}
                                width={45}
                                domain={[0, 24]}
                                ticks={[0, 6, 12, 18, 24]}
                                axisLine={false}
                                tickLine={false}
                                label={{
                                    value: 'Hours / Day',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: 0,
                                    style: { fontSize: 10, fill: CHART_UI.axis, fontWeight: 'bold' }
                                }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                                wrapperStyle={{ outline: 'none' }}
                                offset={20}
                            />
                            <Legend 
                                iconType="circle"
                                iconSize={8}
                                wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                                verticalAlign="bottom"
                            />
                            <Bar
                                dataKey="Operational Hours"
                                stackId="a"
                                fill="#3b82f6"
                                radius={[0, 0, 0, 0]}
                                barSize={40}
                            >
                                {chartData.map((_entry, index) => (
                                    <Cell 
                                        key={`cell-op-${index}`} 
                                        fill="#3b82f6"
                                        fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </Bar>
                            <Bar
                                dataKey="Idle Hours"
                                stackId="a"
                                fill="#94a3b8"
                                radius={[4, 4, 0, 0]}
                                barSize={40}
                            >
                                {chartData.map((_entry, index) => (
                                    <Cell 
                                        key={`cell-idle-${index}`} 
                                        fill="#94a3b8" 
                                        fillOpacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                                        className="transition-all duration-300"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}