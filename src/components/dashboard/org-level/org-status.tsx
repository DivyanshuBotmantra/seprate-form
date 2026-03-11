import StatusComponent1 from './status-components/status-component-1';
import StatusComponent2 from './status-components/status-component-2';
import StatusComponent3 from './status-components/status-component-3';
import StatusComponent4 from './status-components/status-component-4';

interface OrgStatusProps {
    dashboardData?: any;
    dateRange?: {
        from: string;
        to: string;
    };
    selectedBots?: string[];
}

export default function OrgStatus({ dashboardData, dateRange, selectedBots = [] }: OrgStatusProps) {

    const summaryIndexPercentage = dashboardData?.response_body?.summaryIndexPercentage;
    const summaryIndex = dashboardData?.response_body?.summaryIndex;
    const top5Failures = dashboardData?.response_body?.top_5_bot_failures;
    const top5Successes = dashboardData?.response_body?.top_5_bot_successes;
    const botUsagePerDate = dashboardData?.response_body?.bot_usage_per_date;
    const overallStatusPercentage = dashboardData?.response_body?.overall_status_percentage;

    return (
        <div className="h-full w-full min-h-0">

            {/* 2x2 Dashboard Grid */}
            <div className="grid grid-cols-2 grid-rows-2 gap-1 h-full">

                <StatusComponent1
                    summaryIndexPercentage={summaryIndexPercentage}
                    summaryIndex={summaryIndex}
                />

                <StatusComponent2
                    bot_usage_per_date={botUsagePerDate}
                    dateRange={dateRange}
                />

                <StatusComponent3
                    top_5_bot_failures={top5Failures}
                    top_5_bot_successes={top5Successes}
                    selectedBots={selectedBots}
                />

                <StatusComponent4
                    overall_status_percentage={overallStatusPercentage}
                    summaryIndex={summaryIndex}
                />

            </div>
        </div>
    );
}