import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { getTaskExecutionLog } from "@/services/task/get-task-execution-log";
import TaskExecutionLogColumn from "../../components/task/task-execution-column";
import { useDebounce } from "@/hooks/use-debounce";

const TaskCategory = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [taskExecutionLog, setTaskExecutionLog] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
  const [botConfigTriggerUrl, setBotConfigTriggerUrl] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [showStartExecutionButton, setShowStartExecutionButton] =
    useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const task_code = searchParams.get("task_code");
  const task_name = searchParams.get("task_name");

  const table = useReactTable({
    data: taskExecutionLog,
    columns: TaskExecutionLogColumn(taskExecutionLog),
    getCoreRowModel: getCoreRowModel(),
    // Disable client-side filtering since we're using server-side search
    // getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableRowPinning: true,
    manualPagination: true,
    manualFiltering: true, // Tell table we're handling filtering server-side
    pageCount: Math.ceil(totalCount / limit),
  });

  // Get global search value from table and debounce it
  const globalSearchValue = (table.getState().globalFilter as string) ?? "";
  const debouncedGlobalSearch = useDebounce(globalSearchValue, 500);
  const prevDebouncedSearchRef = useRef<string>(debouncedGlobalSearch);

  // Get status filter value from table
  const statusFilterValue = table.getColumn("trans_status")?.getFilterValue() as string[] | undefined;
  const transStatus = statusFilterValue && statusFilterValue.length > 0 ? statusFilterValue : undefined;

  // Get date range filter value from table (stored as { from: "YYYY-MM-DD HH:mm:ss", to?: "YYYY-MM-DD HH:mm:ss" | undefined })
  const dateRangeFilterValue = table.getColumn("created_on")?.getFilterValue() as 
    | { from: string; to?: string | undefined }
    | undefined;

  // Create a stable key that only exists when both dates are present
  const dateRangeKey = useMemo(() => {
    if (!dateRangeFilterValue || !dateRangeFilterValue.from) {
      return null;
    }
    // Include "to" in key if it exists
    return dateRangeFilterValue.to 
      ? `${dateRangeFilterValue.from}-${dateRangeFilterValue.to}`
      : dateRangeFilterValue.from;
  }, [dateRangeFilterValue?.from, dateRangeFilterValue?.to]);

  // Memoize createdOnRange to prevent unnecessary re-renders
  const createdOnRange = useMemo(() => {
    if (!dateRangeFilterValue || !dateRangeFilterValue.from) {
      return undefined;
    }
    return {
      from: dateRangeFilterValue.from,
      to: dateRangeFilterValue.to, // Can be undefined
    };
  }, [dateRangeFilterValue]);



  // Reset offset to 0 when search changes (but not on initial mount)
  useEffect(() => {
    if (prevDebouncedSearchRef.current !== debouncedGlobalSearch) {
      setOffset(0);
      prevDebouncedSearchRef.current = debouncedGlobalSearch;
    }
  }, [debouncedGlobalSearch]);

  // Reset offset when status filter changes
  const prevTransStatusRef = useRef<string[] | undefined>(transStatus);
  useEffect(() => {
    const statusChanged = JSON.stringify(prevTransStatusRef.current) !== JSON.stringify(transStatus);
    if (statusChanged) {
      setOffset(0);
      prevTransStatusRef.current = transStatus;
    }
  }, [transStatus]);

  // Reset offset when date range filter changes (only when both dates are complete)
  const prevDateRangeKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevDateRangeKeyRef.current !== dateRangeKey) {
      setOffset(0);
      prevDateRangeKeyRef.current = dateRangeKey;
    }
  }, [dateRangeKey]);

  // Track the current task_code to prevent race conditions
  const currentTaskCodeRef = useRef<string | null>(task_code);
  const shouldFetchAfterClearRef = useRef(false);
  const hasFetchedAfterClearRef = useRef(false);
  
  // Clear all filters when URL parameters change
  const prevTaskCodeRef = useRef<string | null>(task_code);
  const prevTaskNameRef = useRef<string | null>(task_name);
  useEffect(() => {
    const taskCodeChanged = prevTaskCodeRef.current !== task_code;
    const taskNameChanged = prevTaskNameRef.current !== task_name;
    if (taskCodeChanged || taskNameChanged) {
      // Update current task_code ref immediately
      currentTaskCodeRef.current = task_code;
      
      // Clear all column filters
      table.resetColumnFilters();
      // Clear global filter
      table.resetGlobalFilter();
      // Reset offset
      setOffset(0);
      
      // Update refs
      prevTaskCodeRef.current = task_code;
      prevTaskNameRef.current = task_name;
      
      // Mark that we should fetch after filters are cleared
      shouldFetchAfterClearRef.current = true;
      hasFetchedAfterClearRef.current = false;
      
      // Use a small delay to ensure React has updated the table state
      // After this delay, allow normal filtering to work
      const timeoutId = setTimeout(() => {
        shouldFetchAfterClearRef.current = false;
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [task_code, task_name, table]);

  const fetchTaskExecutionLog = async (options?: { 
    ignoreFilters?: boolean;
    globalSearch?: string;
    statusFilter?: string[] | undefined;
    dateRange?: { from: string; to?: string | undefined } | undefined;
  }) => {
    setIsLoading(true);
    try {
      // Use provided filter values or current values, but ignore if options.ignoreFilters is true
      const useGlobalSearch = options?.ignoreFilters ? "" : (options?.globalSearch ?? debouncedGlobalSearch);
      const useTransStatus = options?.ignoreFilters ? undefined : (options?.statusFilter ?? transStatus);
      const useDateRange = options?.ignoreFilters ? undefined : (options?.dateRange ?? createdOnRange);
      
      const payload = {
        org_name: selectedOrg,
        global_search: useGlobalSearch,
        search_params: {
          task_code: task_code,
          ...(useTransStatus && { trans_status: useTransStatus }),
          ...(useDateRange && useDateRange.from && useDateRange.to && {
            created_on: {
              from: useDateRange.from,
              to: useDateRange.to,
            },
          }),
        },
        return_task_fields: ["all"],
        offset: offset,
        limit: limit,
     
      };

      const res = await getTaskExecutionLog(payload);

      if (res?.data?.response_body) {
        setTaskExecutionLog(res.data.response_body.data);
        if (res.data.response_body.no_of_rows !== undefined) {
          setTotalCount(res.data.response_body.no_of_rows);
        } else if (res.data.response_body.no_of_rows !== undefined) {
          setTotalCount(res.data.response_body.no_of_rows);
        }
      } else {
        setTaskExecutionLog([]);
        setTotalCount(0);
      }

      if (res.error) {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to fetch TB vs GL Reconciliation");
      console.error(err);
      setTaskExecutionLog([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };



  useEffect(() => {
    if (!task_code) {
      return;
    }
    
    // Only fetch if task_code matches current ref (prevents race conditions from rapid route changes)
    // This ensures we only process the latest task_code
    if (currentTaskCodeRef.current !== task_code) {
      return;
    }
    
    // If we're waiting for filters to clear after task_code change, fetch with empty filters once
    if (shouldFetchAfterClearRef.current && !hasFetchedAfterClearRef.current) {
      hasFetchedAfterClearRef.current = true;
      fetchTaskExecutionLog({ ignoreFilters: true });
      // After fetching with cleared filters, clear the flag to allow normal filtering
      shouldFetchAfterClearRef.current = false;
      return;
    }
    
    // Normal fetch with current filters
    fetchTaskExecutionLog();
  }, [selectedOrg, task_code, offset, limit, debouncedGlobalSearch, transStatus, dateRangeKey]);

  return (
    <div className="relative flex flex-1 flex-col h-full">
      <DataTable 
         table={table}
         offset={offset}
         limit={limit}
         totalCount={totalCount}
         onOffsetChange={setOffset}
         onLimitChange={setLimit}>
        <div className="px-3 pt-2">
          <h1 className="font-semibold text-xl">{task_name}</h1>
        </div>
        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Start Execution",
            onClick: () => {
              navigate(botConfigTriggerUrl);
            },
            visible: showStartExecutionButton,
          }}
        />
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

export default TaskCategory;
