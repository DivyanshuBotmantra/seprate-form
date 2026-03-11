import { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { CHART_UI } from '@/components/dashboard/colors';
import EmptyState from '@/components/common/EmptyState';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface HourlyMachineUsage {
    date: string;
    machine_name: string;
    hourly_usage: Record<string, number>;
}

interface MachineComponent3Props {
    hourlyMachineUsage?: HourlyMachineUsage[];
    machineColors: Map<string, string>;
}

export default function MachineComponent3({ hourlyMachineUsage, machineColors }: MachineComponent3Props) {
    const hasData = hourlyMachineUsage && hourlyMachineUsage.length > 0;

    // Get unique dates and machines
    const uniqueDates = useMemo(() => {
        if (!hasData) return [];
        return Array.from(new Set(hourlyMachineUsage.map(item => item.date))).sort();
    }, [hasData, hourlyMachineUsage]);

    const [selectedDate, setSelectedDate] = useState<string>('');

    // Set initial selected date when data loads or changes
    useEffect(() => {
        if (uniqueDates.length > 0) {
            setSelectedDate(uniqueDates[0]); // Select first date in range
        } else {
            setSelectedDate('');
        }
    }, [uniqueDates]);

    // Get machines for selected date
    const machinesForDate = useMemo(() => {
        if (!hasData || !selectedDate) return [];
        return hourlyMachineUsage
            .filter(item => item.date === selectedDate)
            .map(item => item.machine_name);
    }, [hasData, hourlyMachineUsage, selectedDate]);

    // Process data for chart - ensures 0-24 range is always present
    const chartData = useMemo(() => {
        // Create base 25 records for hours 0 to 24
        const baseData = Array.from({ length: 25 }, (_, hour) => {
            const hourStr = String(hour).padStart(2, '0');
            const nextHourStr = String(hour + 1).padStart(2, '0');
            const hourRangeKey = `${hourStr}-${nextHourStr}`;

            return {
                hour: hour,
                hourRange: hourRangeKey,
            };
        });

        if (!hasData || !selectedDate) return baseData;

        const dataForDate = hourlyMachineUsage.filter(item => item.date === selectedDate);

        return baseData.map(entry => {
            const newEntry: any = { ...entry };
            dataForDate.forEach(machineData => {
                newEntry[machineData.machine_name] = machineData.hourly_usage[entry.hourRange] || 0;
            });
            return newEntry;
        });
    }, [hasData, selectedDate, hourlyMachineUsage]);

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;

            return (
                <div
                    className="rounded-lg shadow-xl p-3 border min-w-[220px]"
                    style={{ backgroundColor: CHART_UI.tooltipBg, color: CHART_UI.tooltipText }}
                >
                    <p className="text-xs font-bold mb-2 border-b border-white/10 pb-1.5">
                        Hour: {data.hourRange}
                    </p>
                    <div className="space-y-1.5">
                        {payload.map((entry: any, index: number) => (
                            entry.value > 0 && (
                                <div key={index} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: entry.stroke }}
                                        />
                                        <span className="text-[10px] font-medium truncate max-w-[140px]">
                                            {entry.name.split('.')[0]}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold" style={{ color: entry.stroke }}>
                                        {entry.value} min
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const hourTicks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    const minuteTicks = [0, 10, 20, 30, 40, 50, 60];

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4 gap-4">
                <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                        Hourly Machine Usage
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 ml-3 font-medium">
                        Machine runtime distribution across 24-hour period
                    </p>
                </div>

                {/* Date Selector */}
                {hasData && uniqueDates.length > 0 && (
                    <Select value={selectedDate} onValueChange={setSelectedDate}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                            <SelectValue placeholder="Select date" />
                        </SelectTrigger>
                        <SelectContent>
                            {uniqueDates.map((date) => (
                                <SelectItem key={date} value={date} className="text-xs">
                                    {format(parseISO(date), 'MMM dd, yyyy')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="flex-1 min-h-0">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 20, left: 15, bottom: 5 }}
                        >
                            <defs>
                                {machinesForDate.map((machine) => (
                                    <linearGradient key={machine} id={`color-${machine.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={machineColors.get(machine) || '#3b82f6'} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={machineColors.get(machine) || '#3b82f6'} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_UI.grid} vertical={false} opacity={0.4} />
                            <XAxis
                                dataKey="hour"
                                type="number"
                                domain={[0, 24]}
                                ticks={hourTicks}
                                tick={{ fontSize: 9, fill: CHART_UI.axis }}
                                stroke={CHART_UI.axis}
                                interval={0}
                                height={40}
                                axisLine={{ stroke: CHART_UI.axis, strokeWidth: 1 }}
                                tickMargin={10}
                            />
                            <YAxis
                                type="number"
                                domain={[0, 60]}
                                ticks={minuteTicks}
                                tick={{ fontSize: 10, fill: CHART_UI.axis }}
                                stroke={CHART_UI.axis}
                                width={60}
                                interval={0}
                                axisLine={{ stroke: CHART_UI.axis, strokeWidth: 1 }}
                                tickMargin={8}
                                label={{
                                    value: 'Time (min)',
                                    angle: -90,
                                    position: 'insideLeft',
                                    offset: -5,
                                    style: { fontSize: 11, fill: CHART_UI.axis, fontWeight: 'bold' }
                                }}
                            />
                            <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: 'rgba(59, 130, 246, 0.3)', strokeWidth: 1 }}
                                wrapperStyle={{ outline: 'none' }}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                iconType="circle"
                                iconSize={8}
                                formatter={(value: any) => value.split('.')[0]}
                            />
                            {/* Overlapping areas for each machine */}
                            {machinesForDate.map((machine) => (
                                <Area
                                    key={machine}
                                    type="monotone"
                                    dataKey={machine}
                                    stroke={machineColors.get(machine) || '#3b82f6'}
                                    strokeWidth={2}
                                    fill={`url(#color-${machine.replace(/\s+/g, '-')})`}
                                    fillOpacity={0.6}
                                    isAnimationActive={false}
                                    connectNulls={true}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

    );
}
