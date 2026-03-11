import OrgExecutionColumn from "@/components/org-execution/org-table-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
import orgExecutionService from "@/services/bot/org-execution";
import {
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type SortingState,
    type ColumnFiltersState,
} from "@tanstack/react-table";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useDebounce } from "@/hooks/use-debounce";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";




const DynamicOrgExecutionPages = () => {
    const navigate = useNavigate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [orgExecutionLogs, setOrgExecutionLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
    const [searchParams] = useSearchParams();

    // Read params from URL
    const machine_name = searchParams.get("machine_name");
    const status_filter = searchParams.get("status");

    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const table = useReactTable({
        data: orgExecutionLogs,
        columns: OrgExecutionColumn(),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        enableRowPinning: true,
        manualPagination: true,
        manualFiltering: true,
        pageCount: Math.ceil(totalCount / limit),
    });

    // Get global search value from table and debounce it
    const globalSearchValue = (table.getState().globalFilter as string) ?? "";
    const debouncedGlobalSearch = useDebounce(globalSearchValue, 500);
    const prevDebouncedSearchRef = useRef<string>(debouncedGlobalSearch);

    // Reset offset to 0 when search changes
    useEffect(() => {
        if (prevDebouncedSearchRef.current !== debouncedGlobalSearch) {
            setOffset(0);
            prevDebouncedSearchRef.current = debouncedGlobalSearch;
        }
    }, [debouncedGlobalSearch]);

    const fetchOrgExecutionLog = async () => {
        if (!selectedOrg) return;
        setIsLoading(true);
        try {
            const statusFilter = columnFilters.find((f) => f.id === "status")?.value as string[];

            const payload = {
                org_name: selectedOrg,
                search_params: {
                    machine_name: machine_name || undefined,
                    global_search: debouncedGlobalSearch || undefined,
                    status: statusFilter?.length ? statusFilter : (status_filter ? [status_filter] : []),
                },
                limit: limit,
                offset: offset,
                order_by: sorting.length > 0 ? sorting.map(s => ({
                    field: s.id,
                    desc: s.desc
                })) : [
                    {
                        field: "created_on",
                        desc: true
                    }
                ]
            };

            const res = await orgExecutionService.getOrgExecutionLog(payload);

            if (res?.data?.response_body && Array.isArray(res.data.response_body)) {
                setOrgExecutionLogs(res.data.response_body);
                if (res.data.total_rows !== undefined) {
                    setTotalCount(res.data.total_rows);
                } else {
                    setTotalCount(res.data.response_body.length >= limit ? offset + limit + 1 : offset + res.data.response_body.length);
                }
            } else {
                setOrgExecutionLogs([]);
                setTotalCount(0);
            }
        } catch (err) {
            toast.error("Failed to fetch Org Execution Log");
            console.error(err);
            setOrgExecutionLogs([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate("/it-dashboard");
    };

    // Initial fetch
    useEffect(() => {
        fetchOrgExecutionLog();
    }, [selectedOrg, offset, limit, debouncedGlobalSearch, columnFilters, sorting, machine_name, status_filter]);

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
                <div className="flex items-center justify-between w-full">
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
                            <h1 className="font-semibold text-xl">Org Execution Logs</h1>
                            <span className="text-xs text-muted-foreground">
                                Monitoring bot executions across the organization
                            </span>
                        </div>
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

export default DynamicOrgExecutionPages;
