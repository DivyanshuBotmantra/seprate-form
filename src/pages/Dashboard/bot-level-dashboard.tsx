import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Status from "@/components/dashboard/bot-level/status";
import DateFilter from "@/components/dashboard/date-filter";
import StatusPieChart from "@/components/dashboard/bot-level/status-pie-chart";

import dashapi from "../../services/Dashboard/dashboard";
import botExecutionService from "../../services/bot/bot-execution";
import { toast } from "sonner";
import BotFailure from "@/components/dashboard/bot-level/bot-failure";
import ExecutionStatusGraph from "@/components/dashboard/bot-level/bo-execution-stack-bat";
import AverageExecutionTime from "@/components/dashboard/bot-level/avg-bot-by-time";
import { Button } from "@/components/ui/button";
import { ChevronDown, FileText, RotateCw, Table } from "lucide-react";
import { exportBotDashboardExcel } from "@/components/dashboard/exportDashboard";
import OrbitLoader from "@/components/loader";
import formMasterService from "../../services/form-master";
import { VALID_FORM_ROUTES } from "@/constants/form-routes";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportDashboardToPDF } from "@/components/dashboard/org-level/export-pdf";
import { format } from "date-fns";


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
        to: formatEndOfDay(now),
    };
};

export default function BotLevelDashboard() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Read bot parameters from URL
    const bot_code = searchParams.get("bot_code") || "";
    const bot_name = searchParams.get("bot_name") || "Bot Dashboard";
    const bot_category = searchParams.get("bot_category") || "";

    const [dashbaorddata, setdashboardData] = useState<DashboardType>({});
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [formUrl, setFormUrl] = useState<string>("");
    const [formEmailName, setFormEmailName] = useState<string>("");
    const [formEmailFlag, setFormEmailFlag] = useState<boolean>(false);
    const [formFileTriggerFlag, setFormFileTriggerFlag] = useState<boolean>(false);
    const [formCode, setFormCode] = useState<string>("");
    const [formBotTrigger, setFormBotTrigger] = useState<boolean>(true);
    const [formFound, setFormFound] = useState<boolean>(false); // true only when form master match found
    const dashboardRef = useRef<HTMLDivElement>(null);


    // ✅ Avoid multiple initial calls (dev strict mode)
    const initialFetchDone = useRef(false);

    // ✅ only API filters
    const [filters, setFilters] = useState({
        botCodes: "",
        statuses: [],
        dateRange: getDefaultLast7DaysRange(),
    });

    // ✅ API CALL FUNCTION
    const dashboardDataApi = useCallback(
        async (orgName: string, createdOn: { from: string; to: string }) => {
            if (!orgName || !bot_code) return; // ✅ Also check bot_code

            try {
                setLoading(true);

                const payload = {
                    org_name: orgName,
                    global_search: "",
                    search_params: {
                        bot_code: bot_code, // Dynamic bot_code from URL
                        bot_status: [],
                        created_on: {
                            from: createdOn.from,
                            to: createdOn.to,
                        },
                        bot_start_time: { from: "", to: "" },
                        bot_end_time: { from: "", to: "" },
                    },
                    return_bot_fields: [
                        "bot_execution_id",
                        "bot_code",
                        "created_on",
                        "bot_status",
                        "bot_start_time",
                        "bot_end_time",
                        "machine_name",
                        "bot_fail_reason",
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
                console.error("❌ Dashboard fetch error:", err);
                toast.error("Failed to fetch dashboard data");
                setdashboardData({});
            } finally {
                setLoading(false);
            }
        },
        [bot_code] // ✅ Include bot_code so callback updates when it changes
    );

    // ✅ Call API ONCE on initial page load
    useEffect(() => {
        if (initialFetchDone.current) return;
        initialFetchDone.current = true;

        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;
        const defaultRange = getDefaultLast7DaysRange();

        console.log("✅ Initial dashboard API call", { orgName, defaultRange, bot_code });

        setFilters((prev) => ({
            ...prev,
            dateRange: defaultRange,
        }));

        dashboardDataApi(orgName, defaultRange);
    }, [dashboardDataApi]);

    // ✅ NEW: Watch for bot_code changes (when user clicks different bot in sidebar)
    useEffect(() => {
        // Skip initial load (already handled above)
        if (!initialFetchDone.current) return;

        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;

        console.log("🔄 Bot changed! Fetching new data for:", bot_code);

        // Re-fetch with current filters
        dashboardDataApi(orgName, filters.dateRange);
    }, [bot_code]); // ✅ Re-run when bot_code changes

    // ✅ Match form master config based on bot_code
    useEffect(() => {
        const fetchFormMaster = async () => {
            const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;
            if (!orgName || !bot_code) return;

            try {
                const res = await formMasterService.getformaster({
                    org_name: orgName,
                });

                if (res.data?.response_body) {
                    const forms = res.data.response_body;
                    // Match based on bot_code from form master
                    const matchedForm = forms.find((f: any) => f.bot_code === bot_code);
                    if (matchedForm && matchedForm.form_url) {
                        console.log("🎯 Matched Form Details:", matchedForm);
                        setFormUrl(matchedForm.form_url);
                        setFormEmailName(matchedForm.email_name || "");
                        setFormEmailFlag(matchedForm.email_flag || false);
                        setFormFileTriggerFlag(matchedForm.file_trigger_flag || false);
                        setFormCode(matchedForm.form_code || "");
                        setFormBotTrigger(matchedForm.bot_trigger ?? true);
                        setFormFound(true);
                    } else {
                        console.warn("⚠️ No form master matched for bot_code:", bot_code);
                        setFormFound(false);
                    }
                }
            } catch (err) {
                console.error("❌ Error fetching form master:", err);
            }
        };

        fetchFormMaster();
    }, [bot_code]);


    // ✅ Navigate back to bot list with context from URL
    // const handleBackClick = () => {
    //     navigate(
    //         `/bot?bot_name=${encodeURIComponent(bot_name)}&bot_code=${encodeURIComponent(bot_code)}&bot_category=${encodeURIComponent(bot_category)}`
    //     );
    // };

    // ✅ Handle status card click and navigate to dynamic bot pages
    const handleStatusClick = (status: string) => {
        navigate(
            `/bot?bot_name=${encodeURIComponent(bot_name)}&bot_code=${encodeURIComponent(bot_code)}&bot_category=${encodeURIComponent(bot_category)}&bot_status=${encodeURIComponent(status)}&from=${encodeURIComponent(filters.dateRange.from)}&to=${encodeURIComponent(filters.dateRange.to)}`
        );
    };

    // ✅ Apply filter -> update filter + call API
    const handleApplyFilter = (dateRange: { from: string; to: string }) => {
        console.log("📅 Filter applied:", dateRange);

        setFilters((prev) => ({
            ...prev,
            dateRange: dateRange,
        }));

        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;

        dashboardDataApi(orgName, dateRange);
    };

    const handleRefresh = () => {
        const orgName = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name;
        dashboardDataApi(orgName, filters.dateRange);
        // toast.info("Refreshing dashboard data...");
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
                    bot_code,
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

            const res = await botExecutionService.getBotExecutionLog(payload);
            const rows = res.data?.response_body?.data;

            if (!Array.isArray(rows) || rows.length === 0) {
                toast.warning("No data to export");
                return;
            }

            await exportBotDashboardExcel(rows, bot_name);
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
            `Bot_Dashboard_${bot_name}_${format(new Date(), "yyyyMMdd")}.pdf`,
            orgName,
            `${bot_name} Dashboard Report`
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
                        {/* Left: Back Button + Title */}
                        <div className="flex items-center gap-2">

                            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                                <span className="w-1 h-4 bg-btn-primary rounded-full"></span>
                                {bot_name}
                            </h1>
                        </div>

                        {/* Right: View Data + Bot Trigger + Date Filter + Export Button */}
                        <div className="flex items-center gap-2">
                            {/* View Data Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigate(
                                        `/bot?bot_name=${encodeURIComponent(bot_name)}&bot_code=${encodeURIComponent(bot_code)}&bot_category=${encodeURIComponent(bot_category)}`
                                    );
                                }}
                                className="h-7 px-3 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <svg
                                    className="w-3.5 h-3.5 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                                View Data
                            </Button>

                            {/* Bot Trigger Button */}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={!formFound}
                                title={!formFound ? "No form configured for this bot" : ""}
                                onClick={() => {
                                    // Ensure the URL is correctly prefixed for the router
                                    const targetUrl = formUrl.startsWith('/') ? formUrl : `/form/${formUrl}`;

                                    // ✅ Validate form URL before navigation
                                    if (!VALID_FORM_ROUTES.includes(targetUrl as any)) {
                                        toast.error("Invalid form URL configured. Please contact administrator.");
                                        console.error(`❌ Invalid form URL: ${targetUrl}. Expected one of:`, VALID_FORM_ROUTES);
                                        return;
                                    }
                                    const queryParams = new URLSearchParams({
                                        email_name: formEmailName,
                                        email_flag: String(formEmailFlag),
                                        file_trigger_flag: String(formFileTriggerFlag),
                                        bot_trigger: String(formBotTrigger),
                                        bot_code: bot_code,
                                        bot_name: bot_name,
                                        bot_category: bot_category,
                                        form_code: formCode,
                                        form_name: bot_name,
                                    });

                                    // ✅ Valid URL - proceed with navigation
                                    navigate(`${targetUrl}?${queryParams.toString()}`);
                                }}
                                className="h-7 px-3 text-xs font-medium shadow-sm hover:shadow-md transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >

                                <svg
                                    className="w-3.5 h-3.5 mr-1.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                                Bot Trigger
                            </Button>

                            <DateFilter onApplyFilter={handleApplyFilter} />
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

                            {/* Refresh Button */}
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

                {/* ========== MAIN CONTENT AREA (with loading overlay) ========== */}
                <div className="flex-1 flex flex-col gap-2 min-h-0 relative">
                    {/* ========== SECTION 2: Status Cards ========== */}
                    <Status summaryIndex={dashbaorddata?.summaryIndex} onStatusClick={handleStatusClick} />

                    {/* ========== SECTION 3: Charts Grid - 2x2 ========== */}
                    <div className="flex-1 grid grid-cols-2 grid-rows-[1fr_1fr] gap-2 min-h-[500px]">
                        <StatusPieChart summaryIndexPercentage={dashbaorddata?.summaryIndexPercentage} />
                        <ExecutionStatusGraph
                            data={dashbaorddata?.botExecutionTrend}
                            dateRange={filters.dateRange}
                        />
                        <AverageExecutionTime
                            avgExecutionTimeByBot={dashbaorddata?.avgExecutionTimeByBot}
                            dateRange={filters.dateRange}
                        />
                        <BotFailure failedBotData={dashbaorddata?.failedBotData} />
                    </div>

                    {/* ========== Loading Overlay (only covers content area) ========== */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
                            <div className="flex flex-col items-center gap-3 bg-card p-8 rounded-xl shadow-2xl border">
                                <OrbitLoader size={12} outerColor="border-btn-primary" />
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-foreground">Loading Dashboard</p>
                                    <p className="text-xs text-muted-foreground">Fetching data for {bot_name}...</p>
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
