import { useMemo } from 'react';
import MachineComponent1 from './machine-components/machine-component-1';
import MachineComponent2 from './machine-components/machine-component-2';
import MachineComponent3 from './machine-components/machine-component-3';
import { getMachineColor } from '@/components/dashboard/colors';
import MachineComponent4 from './machine-components/machine-component-4';

interface OrgMachineProps {
    dashboardData?: any;
    dateRange?: { from: string; to: string };
}

export default function OrgMachine({ dashboardData, dateRange }: OrgMachineProps) {
    // Extract data from API response
    const machineUtilization = dashboardData?.response_body?.machine_utilization_daily;
    const machineRuntimeDaily = dashboardData?.response_body?.machine_runtime_daily;
    const hourlyMachineUsage = dashboardData?.response_body?.hourly_machine_usage;
    const machineUtilizationPercentage = dashboardData?.response_body?.machine_utilization_percentage;

    // Create a unified color map for all machines across all components
    const machineColors = useMemo(() => {
        const colorMap = new Map<string, string>();
        const machineSet = new Set<string>();

        // Collect machines from all sources
        machineUtilization?.forEach((item: any) => machineSet.add(item.machine_name));
        machineRuntimeDaily?.forEach((item: any) => machineSet.add(item.machine_name));
        hourlyMachineUsage?.forEach((item: any) => machineSet.add(item.machine_name));
        machineUtilizationPercentage?.forEach((item: any) => machineSet.add(item.machine_name));

        const allMachines = Array.from(machineSet).sort();
        allMachines.forEach(machine => {
            colorMap.set(machine, getMachineColor(machine));
        });

        return colorMap;
    }, [machineUtilization, machineRuntimeDaily, hourlyMachineUsage, machineUtilizationPercentage]);

    return (
        <div className="h-full w-full overflow-y-auto pr-2 custom-scrollbar">
            <div className="flex flex-col gap-4 pb-6">
                {/* Row 1: 1 & 2 side-by-side */}
                <div className="grid grid-cols-2 gap-4 h-[400px] shrink-0">
                    <MachineComponent1 machinePercentage={machineUtilizationPercentage} machineColors={machineColors} />
                    <MachineComponent2 machineUtilization={machineUtilization} machineColors={machineColors} dateRange={dateRange} />
                </div>
                
                {/* Row 2: 4 (Full Width) */}
                <div className="h-[450px] shrink-0">
                    <MachineComponent4 machineRuntimeDaily={machineRuntimeDaily} machineColors={machineColors} dateRange={dateRange} />
                </div>

                {/* Row 3: 3 (Full Width) */}
                <div className="h-[450px] shrink-0 pt-2">
                    <MachineComponent3 hourlyMachineUsage={hourlyMachineUsage} machineColors={machineColors} />
                </div>
            </div>
        </div>
    );
}
