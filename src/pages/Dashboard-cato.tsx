import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DateFilter from "@/components/dashboard/date-filter";

import dashapi from "../services/Dashboard/dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCw } from "lucide-react";
import OrbitLoader from "@/components/loader";
import MachineUtilization from "@/components/dashboard/category-level/machine-utilization";
import BotsDataBasedOnTime from "@/components/dashboard/category-level/Bots-data-based-on-time";
type DashboardType = any;

// ---------------- helpers ----------------
const pad2 = (n: number) => String(n).padStart(2, "0");

const formatStartOfDay = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 00:00:00`;

const formatEndOfDay = (d: Date) =>
    `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} 23:59:59`;

const getDefaultLast7DaysRange = () => {
    const now = new Date();
    const past7 = new Date();
    past7.setDate(now.getDate() - 7);

    return {
        from: formatStartOfDay(past7),
        to: formatEndOfDay(now), // ✅ include full today
    };
};

export default function DashboardCato() {
    const [searchParams] = useSearchParams();

    // Read category from URL
    const bot_category = searchParams.get("category") || "All Bots";

    const [dashbaorddata, setdashboardData] = useState<DashboardType>({});
    const [loading, setLoading] = useState(false);

    // ✅ only API filters
    const [filters, setFilters] = useState({
        botCodes: "",
        statuses: [],
        dateRange: getDefaultLast7DaysRange(),
    });

    // ✅ API CALL FUNCTION
    const dashboardDataApi = useCallback(
        async (orgName: string, createdOn: { from: string; to: string }, category: string) => {
            if (!orgName) return;

            try {
                setLoading(true);

                const payload = {
                    org_name: orgName,
                    global_search: "",
                    search_params: {
                        bot_category: category,
                        bot_code: "",
                        bot_status: [],
                        created_on: {
                            from: createdOn.from,
                            to: createdOn.to,
                        },
                        bot_start_time: { from: "", to: "" },
                        bot_end_time: { from: "", to: "" },
                    },
                    return_bot_fields: [
                        "all"
                    ],
                    offset: 0,
                    limit: 20,
                    order_by: [{ field: "", desc: true }],
                };

                const res = await dashapi.getdashboardData(payload);
                setdashboardData(res?.data?.response_body ?? {});
            } catch (err) {
                console.error("❌ Cato Dashboard fetch error:", err);
                toast.error("Failed to fetch dashboard data");
                setdashboardData({});
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // ✅ Call API when filters change
    useEffect(() => {
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;

        dashboardDataApi(orgName, filters.dateRange, bot_category);
    }, [filters.dateRange, dashboardDataApi, bot_category]);


    // ✅ Apply filter -> update filter
    const handleApplyFilter = (dateRange: { min: string; max: string }) => {
        const updatedRange = {
            from: dateRange.min,
            to: dateRange.max,
        };

        setFilters((prev) => ({
            ...prev,
            dateRange: updatedRange,
        }));
    };

    const handleRefresh = () => {
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;
        dashboardDataApi(orgName, filters.dateRange, bot_category);
    };

    return (
        <div className="h-screen flex flex-col bg-sidebar rounded-lg p-3 overflow-auto custom-scrollbar">
            <div className="flex flex-col flex-1 min-h-0 gap-2">
                {/* ========== SECTION 1: Header ========== */}
                <div className="bg-card rounded-lg p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        {/* Left: Title + Toggle Controls */}
                        <div className="flex items-center gap-4">
                            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                                {bot_category}
                            </h1>
                        </div>

                        {/* Right: Date Filter + Refresh */}
                        <div className="flex items-center gap-2">
                            <DateFilter onApplyFilter={handleApplyFilter} />

                            {/* Refresh Button */}
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Refresh Dashboard"
                            >
                                <RotateCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ========== MAIN CONTENT AREA (with loading overlay) ========== */}
                <div className="flex-1 flex flex-col gap-2 min-h-0 relative">
                    {/* ========== SECTION 3: Charts Grid - Side by Side View ========== */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-h-[500px]">
                        <BotsDataBasedOnTime
                            data={dashbaorddata?.botRunTimeByDate}
                            dateRange={filters.dateRange}
                        />
                        <MachineUtilization
                            data={dashbaorddata?.machineUtilizationDailyTrend}
                            dateRange={filters.dateRange}
                        />
                    </div>

                    {/* ========== Loading Overlay (only covers content area) ========== */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
                            <div className="flex flex-col items-center gap-3 bg-card p-8 rounded-xl shadow-2xl border">
                                <OrbitLoader size={12} outerColor="border-btn-primary" />
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">Loading Dashboard</p>
                                    <p className="text-xs text-muted-foreground">Fetching data...</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
