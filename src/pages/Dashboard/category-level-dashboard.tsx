import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DateFilter from "@/components/dashboard/date-filter";

import dashapi from "../../services/Dashboard/dashboard";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, RotateCw, Table, TableIcon } from "lucide-react";
import OrbitLoader from "@/components/loader";
import MachineUtilization from "@/components/dashboard/category-level/machine-utilization";
import BotsDataBasedOnTime from "@/components/dashboard/category-level/Bots-data-based-on-time";
import { exportCategoryDashboardExcel } from "@/components/dashboard/exportDashboard";
import { exportDashboardToPDF } from "@/components/dashboard/org-level/export-pdf";
import { format } from "date-fns";
import botExecutionService from "../../services/bot/bot-execution";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function CategoryLevelDashboard() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Read category from URL
    const bot_category = searchParams.get("category") || "All Bots";

    const [dashbaorddata, setdashboardData] = useState<DashboardType>({});
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const dashboardRef = useRef<HTMLDivElement>(null);

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

                if (res?.data?.status_code === 403) {
                    setdashboardData({});
                } else {
                    setdashboardData(res?.data?.response_body ?? {});
                }
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
    const handleApplyFilter = (dateRange: { from: string; to: string }) => {
        setFilters((prev) => ({
            ...prev,
            dateRange: dateRange,
        }));
    };

    const handleRefresh = () => {
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;
        dashboardDataApi(orgName, filters.dateRange, bot_category);
    };

    const handleExportExcel = async () => {
        try {
            const orgName = JSON.parse(
                sessionStorage.getItem("SelectedOrg") || "{}"
            )?.org_name;

            if (!orgName) {
                toast.error("Organization not found");
                return;
            }

            setExporting(true);

            const payload = {
                org_name: orgName,
                global_search: "",
                search_params: {
                    bot_category: bot_category,
                    bot_status: [],
                    created_on: filters.dateRange,
                    bot_start_time: { from: "", to: "" },
                    bot_end_time: { from: "", to: "" },
                },
                return_bot_fields: ["all"],
                offset: 0,
                limit: 10000,
                order_by: [{ field: "", desc: true }],
            };

            const res = await botExecutionService.getBotCategoryExecutionLog(payload);
            const rows = res.data?.response_body?.data;

            if (!Array.isArray(rows) || rows.length === 0) {
                toast.warning("No data to export");
                return;
            }

            await exportCategoryDashboardExcel(rows, bot_category);
            toast.success("Excel exported successfully");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Export failed");
        } finally {
            setExporting(false);
        }
    };

    const handleExportPDF = async () => {
        const orgName = JSON.parse(
            sessionStorage.getItem("SelectedOrg") || "{}"
        )?.org_name;

        await exportDashboardToPDF(
            dashboardRef,
            setExporting,
            `Category_Dashboard_${bot_category}_${format(new Date(), "yyyyMMdd")}.pdf`,
            orgName,
            `${bot_category} Dashboard Report`
        );
    };

    return (
        <div className="h-screen flex flex-col bg-sidebar rounded-lg overflow-hidden relative">
            <div
                ref={dashboardRef}
                className="flex flex-col flex-1 min-h-0 gap-2 p-3 bg-sidebar overflow-auto custom-scrollbar"
            >
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

                        {/* Right: View Data + Date Filter + Export + Refresh */}
                        <div className="flex items-center gap-2">
                            {/* View Data Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    navigate(
                                        `/bot-category?bot_category=${encodeURIComponent(bot_category)}`
                                    )
                                }
                                className="h-8 gap-1.5 text-xs font-medium"
                                title="View execution data for this category"
                            >
                                <TableIcon className="h-3.5 w-3.5" />
                                View Data
                            </Button>

                            <DateFilter onApplyFilter={handleApplyFilter} />

                            {/* Export Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-medium bg-btn-primary hover:bg-btn-primary/90 text-darkLight transition-all duration-300 gap-1.5"
                                        disabled={exporting}
                                    >
                                        {exporting ? (
                                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                    <polyline points="7 10 12 15 17 10"></polyline>
                                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                                </svg>
                                                Export
                                            </>
                                        )}
                                        <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer gap-2">
                                        <Table className="w-4 h-4 text-success" />
                                        <span>Export Excel</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer gap-2">
                                        <FileText className="w-4 h-4 text-danger" />
                                        <span>Export PDF</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

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

            {/* ========== EXPORTING OVERLAY (PDF Generation) ========== */}
            {exporting && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3 bg-card p-8 rounded-xl shadow-2xl border">
                        <OrbitLoader size={12} outerColor="border-btn-primary" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">Exporting</p>
                            <p className="text-xs text-muted-foreground">
                                Preparing your dashboard export...
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
