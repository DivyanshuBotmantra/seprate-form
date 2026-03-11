import { useMemo } from 'react';
import EmptyState from '@/components/common/EmptyState';


interface MachineComponent1Props {
    machinePercentage?: Array<{
        machine_name: string;
        percentage: string;
    }>;
    machineColors: Map<string, string>;
}

export default function MachineComponent1({ machinePercentage, machineColors }: MachineComponent1Props) {
    // Check if data exists
    const hasData = machinePercentage && machinePercentage.length > 0;

    // Process data for Machine Percentage view (Direct mapping from API)
    const { percentageData, averagePercentage } = useMemo(() => {
        if (!hasData) return { percentageData: [], averagePercentage: 0 };

        const data = machinePercentage.map(item => ({
            machineName: item.machine_name,
            percentage: parseFloat(item.percentage.replace('%', '')),
        }));

        const avg = data.reduce((sum, item) => sum + item.percentage, 0) / data.length;

        return { percentageData: data, averagePercentage: avg };
    }, [hasData, machinePercentage]);

    return (
        <div className="bg-card rounded-xl p-6 border-2 border-border shadow-lg hover:shadow-xl transition-all duration-300 hover:border-btn-primary/30 h-full flex flex-col">
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <span className="w-1 h-6 bg-btn-primary rounded-full"></span>
                    Machine Utilization %
                </h3>

                {hasData && (
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Avg Utilization</span>
                        <span className="text-xl font-black text-btn-primary drop-shadow-sm">
                            {averagePercentage.toFixed(2)}%
                        </span>
                    </div>
                )}
            </div>

            {/* Chart Area */}
            <div className="flex-1 min-h-0 relative">
                {!hasData ? (
                    <EmptyState />
                ) : (
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <div className="space-y-2">
                            {percentageData
                                .sort((a, b) => b.percentage - a.percentage)
                                .map((machine, index) => {
                                    const machineColor = machineColors.get(machine.machineName) || '#3b82f6';
                                    const nameParts = machine.machineName.split('.');
                                    const mainName = nameParts[0];
                                    const domain = nameParts.slice(1).join('.');

                                    return (
                                        <div
                                            key={index}
                                            className="px-4 py-2.5 bg-sidebar/30 hover:bg-sidebar/50 rounded-lg border-l-4 transition-all duration-200 shadow-sm border-y border-r border-muted-foreground/10"
                                            style={{ borderLeftColor: machineColor }}
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <span className="text-[11px] font-black text-foreground uppercase tracking-tight truncate">
                                                        {mainName}
                                                    </span>
                                                    {domain && (
                                                        <span className="text-[9px] text-muted-foreground truncate opacity-70">
                                                            {domain}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <div className="w-20 bg-sidebar rounded-full h-1.5 overflow-hidden shadow-inner">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(machine.percentage, 100)}%`,
                                                                backgroundColor: machineColor
                                                            }}
                                                        />
                                                    </div>
                                                    <div
                                                        className="px-2 py-0.5 rounded-full text-[10px] font-black min-w-[55px] text-center"
                                                        style={{
                                                            backgroundColor: `${machineColor}15`,
                                                            color: machineColor,
                                                            border: `1px solid ${machineColor}30`
                                                        }}
                                                    >
                                                        {machine.percentage.toFixed(2)}%
                                                    </div>
                                                </div>
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
