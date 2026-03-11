import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import PageHeader from "@/components/common/header";
import BotconfigColumn from "@/components/bot-config/botconfig-columns";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";

import { useState, useCallback } from "react";
import { BotConfigCreateSheet } from "@/components/bot-config/sheet/BotConfig-Create-Sheet";
import { toast } from "sonner";
import botConfigApi from "@/services/botConfig";
import { useOrgData } from "@/hooks/useOrgData";
import { isSuperAdmin } from "@/lib/auth";

/* ---------------- Types ---------------- */

type BotConfigItem = {
  org_name: string;
  bot_code: string;
  bot_name: string;
  bot_category: string;
  master_files: Record<string, any> | null;
  master_file_folder_path: string | null;
  master_file_credential: Record<string, any> | null;
  storage_encryption: boolean;
  bot_status: "ACTIVE" | "INACTIVE";
};

/* ---------------- Component ---------------- */

const Botconfig = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [botConfigData, setBotConfigData] = useState<BotConfigItem[]>([]);

  const isSuper = isSuperAdmin();

  /* ---------------- Fetch Bot Config ---------------- */

  const fetchBotConfig = useCallback(async (orgName: string) => {
    if (!orgName) return;

    try {
      const payload = {
        org_name: orgName,
        bot_code: "",
        bot_name: "",
        bot_category: "",
        bot_status: "ACTIVE",
      };

      const res = await botConfigApi.getBotConfig(payload);
      setBotConfigData(res?.data?.response_body || []);
    } catch (err) {
      toast.error("Failed to fetch bot config");
      setBotConfigData([]);
      console.error(err);
    }
  }, []);

  // Auto-fetch when org changes
  useOrgData(fetchBotConfig);

  /* ---------------- Refresh Table ---------------- */

  const refreshTable = () => {
    const orgName = JSON.parse(
      sessionStorage.getItem("SelectedOrg") || "{}"
    )?.org_name;

    fetchBotConfig(orgName);
  };

  
  /* ---------------- Table Setup ---------------- */

  const table = useReactTable({
    data: botConfigData,
    columns: BotconfigColumn(refreshTable, isSuper),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    enableRowPinning: true,
  });

  return (
    <>
      <DataTable table={table}>
        <PageHeader title="Bot Config" />
        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Create Bot Config",
            onClick: () => setSheetOpen(true),
            visible: isSuper,
          }}
        />
      </DataTable>

      {/* Create Sheet (identity only) */}
      <BotConfigCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Bot Config"
        loading={loading}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default Botconfig;
