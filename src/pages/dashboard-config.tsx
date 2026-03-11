import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import PageHeader from "@/components/common/header";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import dashboardConfig from "@/services/dashboard-config";
import { useOrgData } from "@/hooks/useOrgData";
import { isSuperAdmin } from "@/lib/auth";
import DashboardConfigColumn from "@/components/dashboard-config/dashboard-column";
import { DashboardConfigCreateSheet } from "@/components/dashboard-config/sheet/create-dashboard-config-sheet";

// ---------- TYPES ----------
type DashboardConfigItem = {
  dashboard_name: string;
  org_name: string;
  dashboard_config_json: Record<string, any>;
  dashboard_url: string;
  dashboard_status: "ACTIVE" | "INACTIVE";
};

// ---------- COMPONENT ----------
const DashboardConfig = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [dashboardConfigData, setDashboardConfigData] = useState<
    DashboardConfigItem[]
  >([]);

  // ---------- ROLE CHECK ----------
  const isSuper = isSuperAdmin();

  // ---------- USER ASSIGNMENT SHEET STATE ----------
  const [dashboardUserSheetOpen, setDashboardUserSheetOpen] = useState(false);
  const [selectedDashboardName, setSelectedDashboardName] =
    useState<string>("");

  // ---------- FETCH DASHBOARD CONFIG ----------
  const getDashboardConfig = useCallback(async (orgName: string) => {
    if (!orgName) return;

    try {
      const payload = {
        org_name: orgName,
        dashboard_name: "",
        dashboard_status: "ACTIVE",
      };

      const res = await dashboardConfig.getdashboardconfig(payload);

      setDashboardConfigData(res?.data?.response_body || []);

      if (res?.error) {
        console.error("Dashboard config fetch error:", res.error);
      }
    } catch (err) {
      toast.error("Failed to fetch dashboard config");
      setDashboardConfigData([]);
      console.error("Error fetching dashboard config:", err);
    }
  }, []);

  useOrgData(getDashboardConfig);

  // ---------- GLOBAL FILTER ----------
  const globalFilterFn = (row: any, _columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase();
    const { dashboard_name, dashboard_status, dashboard_config_json } =
      row.original;

    return (
      dashboard_name?.toLowerCase().includes(search) ||
      dashboard_status?.toLowerCase().includes(search) ||
      JSON.stringify(dashboard_config_json)?.toLowerCase().includes(search)
    );
  };

  // ---------- REFRESH TABLE ----------
  const refreshTable = () => {
    const orgName = JSON.parse(
      sessionStorage.getItem("SelectedOrg") || "{}"
    )?.org_name;

    getDashboardConfig(orgName);
  };

  // ---------- OPEN USER ASSIGNMENT SHEET ----------
  const openDashboardUserSheet = (dashboardName: string) => {
    setSelectedDashboardName(dashboardName);
    setDashboardUserSheetOpen(true);
  };

  // ---------- TABLE ----------
  const table = useReactTable({
    data: dashboardConfigData,
    columns: DashboardConfigColumn(refreshTable, openDashboardUserSheet, isSuper),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    globalFilterFn,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    enableRowPinning: true,
  });

  return (
    <>
      <DataTable table={table}>
        <PageHeader title="Dashboard Configurations" />
        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Create Dashboard Config",
            onClick: () => setSheetOpen(true),
            visible: isSuperAdmin(),
          }}
        />
      </DataTable>

      <DashboardConfigCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Dashboard Config"
        loading={loading}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default DashboardConfig;
