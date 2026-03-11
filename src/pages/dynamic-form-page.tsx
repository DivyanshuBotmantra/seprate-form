import FormLogColumn from "@/components/form-log/form-log-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
import { getFormExecutionLog } from "@/services/bot/form-execution";
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

// Get auto-refresh interval from environment variable (in seconds), default to 30 seconds
const AUTO_REFRESH_INTERVAL = parseInt(import.meta.env.VITE_AUTO_REFRESH_INTERVAL || "30", 10);

const DynamicFormPage = () => {
    const navigate = useNavigate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [formLogs, setFormLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
    const [searchParams] = useSearchParams();

    const form_code = searchParams.get("form_code");
    const form_name = searchParams.get("form_name");
    const form_status_url = searchParams.get("form_status");
    const bot_status_url = searchParams.get("bot_status");
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const table = useReactTable({
        data: formLogs,
        columns: FormLogColumn(form_name || ""),
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

    const globalSearchValue = (table.getState().globalFilter as string) ?? "";
    const debouncedGlobalSearch = useDebounce(globalSearchValue, 500);
    const prevDebouncedSearchRef = useRef<string>(debouncedGlobalSearch);

    useEffect(() => {
        if (prevDebouncedSearchRef.current !== debouncedGlobalSearch) {
            setOffset(0);
            prevDebouncedSearchRef.current = debouncedGlobalSearch;
        }
    }, [debouncedGlobalSearch]);

    const fetchFormExecutionLog = async () => {
        if (!form_code || !selectedOrg) return;

        setIsLoading(true);
        try {
            const formStatusFilter = columnFilters.find((f) => f.id === "form_status")?.value as string[];
            const botStatusFilter = columnFilters.find((f) => f.id === "bot_status")?.value as string[];

            const payload = {
                org_name: selectedOrg,
                global_search: debouncedGlobalSearch,
                search_params: {
                    form_code: form_code,
                    form_status: formStatusFilter?.length
                        ? formStatusFilter
                        : form_status_url
                            ? [form_status_url]
                            : [],
                    bot_status: botStatusFilter?.length
                        ? botStatusFilter
                        : bot_status_url
                            ? [bot_status_url]
                            : [],
                    created_on: {
                        from: fromDate || "",
                        to: toDate || "",
                    },
                },
                return_form_fields: ["all"],
                offset: offset,
                limit: limit,
                order_by: sorting.map((s) => ({
                    field: s.id,
                    desc: s.desc,
                })),
            };

            const res = await getFormExecutionLog(payload);

            if (res?.data?.response_body) {
                setFormLogs(res.data.response_body.data || []);
                setTotalCount(res.data.response_body.no_of_rows || 0);
            } else {
                setFormLogs([]);
                setTotalCount(0);
            }

            if (res.error) {
                toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to fetch Form Execution Log");
            console.error(err);
            setFormLogs([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackClick = () => {
        navigate(-1);
    };

    useEffect(() => {
        fetchFormExecutionLog();
    }, [selectedOrg, form_code, form_status_url, bot_status_url, fromDate, toDate, offset, limit, debouncedGlobalSearch, columnFilters, sorting]);

    // Auto-refresh timer
    useEffect(() => {
        if (!form_code) return;

        const interval = setInterval(() => {
            fetchFormExecutionLog();
        }, AUTO_REFRESH_INTERVAL * 1000);

        return () => clearInterval(interval);
    }, [form_code, selectedOrg, debouncedGlobalSearch, columnFilters, sorting]);

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
                        <h1 className="font-semibold text-xl">{form_name || "Form Execution Log"}</h1>
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

export default DynamicFormPage;
