import TbReconColumn from "@/components/bots/tb-vs-gl/tb-recon-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
import botExecutionService from "@/services/bot/bot-execution";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// Get auto-refresh interval from environment variable (in seconds), default to 30 seconds
const AUTO_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_AUTO_REFRESH_INTERVAL || "30", 10);

const DynamicBotPages = () => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [tbRecon, setTbRecon] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
  const [searchParams] = useSearchParams();
  const bot_code = searchParams.get("bot_code");
  const bot_name = searchParams.get("bot_name");
  const bot_category = searchParams.get("bot_category");
  const bot_status = searchParams.get("bot_status");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [activeSheetExecutionId, setActiveSheetExecutionId] = useState<string | null>(null);

  // Recompute columns whenever tbRecon changes so list_param dynamic columns appear
  const columns = useMemo(
    () => TbReconColumn({
      bot_name: bot_name || "",
      data: tbRecon,
      activeSheetExecutionId,
      onSheetOpenChange: setActiveSheetExecutionId,
    }),
    [tbRecon, bot_name, activeSheetExecutionId]
  );

  const table = useReactTable({
    data: tbRecon,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Disable client-side filtering since we're using server-side search
    // getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    enableRowPinning: true,
    manualPagination: true,
    manualFiltering: true, // Tell table we're handling filtering server-side
    pageCount: Math.ceil(totalCount / limit),
  });

  // Get global search value from table and debounce it
  const globalSearchValue = (table.getState().globalFilter as string) ?? "";
  const debouncedGlobalSearch = useDebounce(globalSearchValue, 500);
  const prevDebouncedSearchRef = useRef<string>(debouncedGlobalSearch);

  // Get date range filter value from the "created_on" column (set by the date picker in the toolbar)
  const dateRangeFilterValue = table.getColumn("created_on")?.getFilterValue() as
    | { from: string; to?: string | undefined }
    | undefined;

  // Build a stable key — only changes when BOTH from & to are present, preventing partial-update re-fetches
  const dateRangeKey = useMemo(() => {
    if (!dateRangeFilterValue?.from) return null;
    return dateRangeFilterValue.to
      ? `${dateRangeFilterValue.from}-${dateRangeFilterValue.to}`
      : dateRangeFilterValue.from;
  }, [dateRangeFilterValue?.from, dateRangeFilterValue?.to]);

  // Resolve the active date range: column filter takes priority over URL params
  const activeDateRange = useMemo(() => {
    if (dateRangeFilterValue?.from && dateRangeFilterValue?.to) {
      return { from: dateRangeFilterValue.from, to: dateRangeFilterValue.to };
    }
    // Fall back to URL params (from bot-dashboard drill-down)
    return { from: fromDate || "", to: toDate || "" };
  }, [dateRangeFilterValue, fromDate, toDate]);

  // Reset offset to 0 when search changes (but not on initial mount)
  useEffect(() => {
    if (prevDebouncedSearchRef.current !== debouncedGlobalSearch) {
      setOffset(0);
      prevDebouncedSearchRef.current = debouncedGlobalSearch;
    }
  }, [debouncedGlobalSearch]);

  // Reset offset when date range filter changes
  const prevDateRangeKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevDateRangeKeyRef.current !== dateRangeKey) {
      setOffset(0);
      prevDateRangeKeyRef.current = dateRangeKey;
    }
  }, [dateRangeKey]);

  const fetchBotExecutionLog = useCallback(async () => {
    setIsLoading(true);
    try {
      const botStatusFilter = columnFilters.find((f) => f.id === "bot_status")?.value as string[];

      const payload = {
        org_name: selectedOrg,
        global_search: debouncedGlobalSearch,
        search_params: {
          bot_name: bot_name,
          bot_category: bot_category,
          bot_code: bot_code,
          bot_status: botStatusFilter?.length
            ? botStatusFilter
            : bot_status
              ? [bot_status]
              : [],
          created_on: {
            from: activeDateRange.from,
            to: activeDateRange.to,
          },
        },
        return_bot_fields: ["all"],
        offset: offset,
        limit: limit,
      };

      const res = await botExecutionService.getBotExecutionLog(payload);

      if (res?.data?.response_body) {
        setTbRecon(res.data.response_body.data);
        if (res.data.response_body.no_of_rows !== undefined) {
          setTotalCount(res.data.response_body.no_of_rows);
        }
      } else {
        setTbRecon([]);
        setTotalCount(0);
      }

      if (res.error) {
        // toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to fetch Bot Execution Log");
      console.error(err);
      setTbRecon([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOrg, bot_code, bot_name, bot_category, bot_status, activeDateRange, offset, limit, debouncedGlobalSearch, columnFilters]);

  const handleBackClick = () => {
    navigate(
      `/bot-dashboard?bot_code=${encodeURIComponent(bot_code || "")}&bot_name=${encodeURIComponent(bot_name || "")}&bot_category=${encodeURIComponent(bot_category || "")}`
    );
  };

  // Initial fetch when dependencies change
  useEffect(() => {
    if (bot_code) {
      fetchBotExecutionLog();
    }
  }, [fetchBotExecutionLog, bot_code]);

  // Auto-refresh timer — paused when a view sheet is open
  useEffect(() => {
    if (!bot_code || activeSheetExecutionId) return;

    const interval = setInterval(() => {
      fetchBotExecutionLog();
    }, AUTO_REFRESH_INTERVAL * 1000); // Convert seconds to milliseconds

    return () => clearInterval(interval);
  }, [fetchBotExecutionLog, activeSheetExecutionId, bot_code]);

  useEffect(() => {
    console.log(tbRecon, "tbRecon");
  }, [tbRecon]);

  return (
    <div className="relative flex flex-1 flex-col h-full">
      <DataTable
        table={table}
        offset={offset}
        limit={limit}
        totalCount={totalCount}
        onOffsetChange={setOffset}
        onLimitChange={setLimit}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-7 w-7 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-semibold text-xl">{bot_name}</h1>
            {(fromDate && toDate) && (
              <span className="text-xs text-muted-foreground">
                Filtered: {fromDate.split(" ")[0]} - {toDate.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
        <DataTableToolbar table={table} excludeColumns={["actions"]} />
      </DataTable>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Spinner className="size-8" />
            <p className="text-sm text-muted-foreground">Loading data...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicBotPages;
