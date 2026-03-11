import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RotateCw, ChevronDown, Table, FileText } from "lucide-react";
import DateFilter from "@/components/dashboard/date-filter";
import BotFilter from "@/components/dashboard/org-level/bot-filter";
import SourceFilter from "@/components/dashboard/org-level/source-filter";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { exportOrgDashboardExcel } from "@/components/dashboard/export-dashbaord-org";
import { exportDashboardToPDF } from "@/components/dashboard/org-level/export-pdf";
import { toast } from "sonner";
// Import the org-level components
import OrgStatus from "@/components/dashboard/org-level/org-status";
import OrgMachine from "@/components/dashboard/org-level/org-machine";
import OrbitLoader from "@/components/loader";
import { useOrgStore } from "@/lib/store/org-store";
import dashboardService from "@/services/Dashboard/dashboard";
import orgExecutionService from "@/services/bot/org-execution";
import { format, subDays } from "date-fns";

const formatApiDateTime = (date: Date, endOfDay: boolean = false) => {
    const day = format(date, "yyyy-MM-dd");
    return endOfDay ? `${day} 23:59:59` : `${day} 00:00:00`;
};

export default function ItLevelDashboard() {
    const navigate = useNavigate();
    const today = new Date();
    const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);

    const [loading, setLoading] = useState(false);
    const [exportType, setExportType] = useState<"excel" | "pdf" | null>(null);
    const exporting = exportType !== null;
    const [activeView, setActiveView] = useState<"status" | "machine">("status");
    const [selectedBots, setSelectedBots] = useState<string[]>([]);
    const [selectedSources, setSelectedSources] = useState<string[]>([]);
    const dashboardRef = useRef<HTMLDivElement>(null);

    // Date filter state - Default past 7 days
    const [dateRange, setDateRange] = useState({
        from: formatApiDateTime(subDays(today, 7), false),
        to: formatApiDateTime(today, true),
    });

    // Dashboard data state
    const [dashboardData, setDashboardData] = useState<any>(null);

    // Bot names from API (populated from total_bot_name_per_org)
    const [availableBots, setAvailableBots] = useState<string[]>([]);
    const [availableSources, setAvailableSources] = useState<string[]>([]);

    const fetchDashboardData = async () => {
        if (!selectedOrg) {
            toast.error("Please select an organization");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                org_name: selectedOrg,
                api_filter: activeView,
                search_params: {
                    source: selectedSources,
                    bot_name: activeView === "status" ? selectedBots : [],
                    machine_name: activeView === "machine" ? selectedBots : [],
                    bot_status: [],
                    created_on: dateRange,
                    bot_start_time: { from: "", to: "" },
                    bot_end_time: { from: "", to: "" },
                },
                return_bot_fields: ["all"],
                offset: 0,
                limit: 10000,
                order_by: [{ field: "", desc: true }],
            };

            const response = await dashboardService.getOrgDashboardData(payload);

            if (response.data?.status_code === 403) {
                setDashboardData(null);
                setAvailableBots([]);
                setAvailableSources([]);
            } else if (response.error) {
                setDashboardData(null);
                setAvailableBots([]);
                setAvailableSources([]);
            } else {
                setDashboardData(response.data);

                // Extract sources (always available)
                const sources = response.data?.response_body?.source || [];
                setAvailableSources(sources);

                // Extract names from response
                if (activeView === "status") {
                    const botNames = response.data?.response_body?.total_bot_name_per_org || [];
                    setAvailableBots(botNames);
                } else {
                    // Use total_machine_name_per_org if available, otherwise fallback to manual extraction
                    const body = response.data?.response_body;
                    const machineNames = body?.total_machine_name_per_org;

                    if (Array.isArray(machineNames) && machineNames.length > 0) {
                        setAvailableBots(machineNames);
                    } else {
                        // Fallback: Extract machine names from all possible sources in the machine view
                        const machineSet = new Set<string>();
                        body?.machine_utilization_percentage?.forEach((m: any) => machineSet.add(m.machine_name));
                        body?.machine_utilization_daily?.forEach((m: any) => machineSet.add(m.machine_name));
                        body?.machine_runtime_daily?.forEach((m: any) => machineSet.add(m.machine_name));
                        body?.hourly_machine_usage?.forEach((m: any) => machineSet.add(m.machine_name));
                        setAvailableBots(Array.from(machineSet).sort());
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            toast.error("Failed to fetch dashboard data");
            setDashboardData(null);
        } finally {
            setLoading(false);
        }
    };

    // Initial load and when filters change
    useEffect(() => {
        fetchDashboardData();
    }, [selectedOrg, selectedBots, selectedSources, dateRange, activeView]);

    const handleApplyFilter = (newDateRange: { from: string; to: string }) => {
        setDateRange({ ...newDateRange });
    };

    const handleRefresh = () => {
        fetchDashboardData();
    };

    const handleViewSwitch = (view: "status" | "machine") => {
        if (activeView === view) return; // Don't reload if already on this view
        setActiveView(view);
        setSelectedBots([]); // Reset selections when switching views
        setSelectedSources([]); // Reset source selections when switching views
    };

    const handleApplyBotFilter = (bots: string[]) => {
        setSelectedBots(bots);
    };

    const handleApplySourceFilter = (sources: string[]) => {
        setSelectedSources(sources);
    };

    const handleViewData = () => {
        navigate("/org-execution");
    };

    const handleExportExcel = async () => {
        if (!selectedOrg) return;
        try {
            setExportType("excel");
            const payload = {
                org_name: selectedOrg,
                search_params: {
                    source: selectedSources,
                    bot_name: activeView === "status" ? selectedBots : [],
                    machine_name: activeView === "machine" ? selectedBots : [],
                    created_on: dateRange,
                },
                limit: 10000,
                offset: 0,
                order_by: [{ field: "created_on", desc: true }],
            };

            const response = await orgExecutionService.getOrgExecutionLog(payload);
            const rows = response.data?.response_body;

            if (Array.isArray(rows) && rows.length > 0) {
                await exportOrgDashboardExcel(rows, selectedOrg);
                toast.success("Excel exported successfully");
            } else {
                toast.warning("No data to export");
            }
        } catch (error) {
            toast.error("Excel export failed");
        } finally {
            setExportType(null);
        }
    };

    const handleExportPDF = async () => {
        await exportDashboardToPDF(
            dashboardRef,
            (val: boolean) => setExportType(val ? "pdf" : null),
            `IT_Dashboard_${selectedOrg}_${format(new Date(), "yyyyMMdd")}.pdf`,
            selectedOrg || "",
            "Enterprise IT Dashboard"
        );
    };


    return (
        <div className="h-screen flex flex-col bg-sidebar rounded-lg overflow-hidden relative">
            {/* ================= EXPORT AREA ================= */}
            <div
                ref={dashboardRef}
                id="org-dashboard-export"
                className="flex flex-col gap-2 p-3 flex-1 min-h-0 bg-sidebar"
            >
                {/* ========== SECTION 1: Header (Exported) ========== */}
                <div className="bg-card rounded-lg p-2.5 shadow-sm">
                    <div className="flex items-center justify-between">
                        {/* Left: Title */}
                        <div className="flex items-center gap-2">
                            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                                IT Dashboard
                            </h1>

                            {/* Toggle Button */}
                            <div className="flex items-center gap-1 ml-4 bg-sidebar border border-muted-foreground/20 rounded-lg p-1">
                                <Button
                                    variant={activeView === "status" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleViewSwitch("status")}
                                    disabled={loading}
                                    className={`h-7 px-3 text-xs font-medium transition-all duration-300 ${activeView === "status"
                                        ? "bg-btn-primary hover:bg-btn-primary/90 text-darkLight"
                                        : "hover:bg-muted text-muted-foreground"
                                        }`}
                                >
                                    Status
                                </Button>
                                <Button
                                    variant={activeView === "machine" ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleViewSwitch("machine")}
                                    disabled={loading}
                                    className={`h-7 px-3 text-xs font-medium transition-all duration-300 ${activeView === "machine"
                                        ? "bg-btn-primary hover:bg-btn-primary/90 text-darkLight"
                                        : "hover:bg-muted text-muted-foreground"
                                        }`}
                                >
                                    Machine
                                </Button>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleViewData}
                                className="h-7 px-3 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <Table className="w-3.5 h-3.5 mr-1.5" />
                                View Data
                            </Button>

                            <div data-date-filter>
                                <DateFilter onApplyFilter={handleApplyFilter} />
                            </div>

                            <SourceFilter
                                availableSources={availableSources}
                                selectedSources={selectedSources}
                                onApplyFilter={handleApplySourceFilter}
                            />

                            <BotFilter
                                availableBots={availableBots}
                                selectedBots={selectedBots}
                                onApplyFilter={handleApplyBotFilter}
                                label={activeView === "status" ? "Bot Filter" : "Machine Filter"}
                                searchPlaceholder={activeView === "status" ? "Filter bots" : "Filter machines"}
                            />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 px-3 text-xs font-medium bg-btn-primary hover:bg-btn-primary/90 text-darkLight transition-all duration-300 gap-1.5"
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

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleRefresh}
                                disabled={loading}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                title="Refresh Dashboard"
                            >
                                <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ========== DASHBOARD CONTENT (Exported) ========== */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    {activeView === "status" ? (
                        <OrgStatus dashboardData={dashboardData} dateRange={dateRange} selectedBots={selectedBots} />
                    ) : (
                        <OrgMachine dashboardData={dashboardData} dateRange={dateRange} />
                    )}
                </div>
            </div>
            {/* ================= END EXPORT AREA ================= */}

            {/* ========== LOADING OVERLAY (Not Exported) ========== */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3 bg-card p-8 rounded-xl shadow-2xl border">
                        <OrbitLoader size={12} outerColor="border-btn-primary" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">Loading Dashboard</p>
                            <p className="text-xs text-muted-foreground">
                                Fetching organization data...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== EXPORTING OVERLAY ========== */}
            {exporting && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm z-50">
                    <div className="flex flex-col items-center gap-3 bg-card p-8 rounded-xl shadow-2xl border">
                        <OrbitLoader size={12} outerColor="border-btn-primary" />
                        <div className="text-center">
                            <p className="text-sm font-semibold text-foreground">
                                {exportType === "excel" ? "Generating Excel" : "Generating PDF"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {exportType === "excel"
                                    ? "Preparing your Excel export..."
                                    : "Preparing your dashboard export..."}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
