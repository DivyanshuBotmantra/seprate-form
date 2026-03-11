import CateoColumn from "@/components/bots/cateo/cateo-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
import botExecutionService from "@/services/bot/bot-execution";
import botConfigApi from "@/services/botConfig";
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



const DynamicCatoPage = () => {
    const navigate = useNavigate();
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [tableData, setTableData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
    const [searchParams] = useSearchParams();

    // For category page we receive bot_category (not bot_name / bot_code)
    const bot_category = searchParams.get("bot_category");
    const bot_status = searchParams.get("bot_status");

    const [offset, setOffset] = useState(0);
    const [limit, setLimit] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    // Pre-fetched bot name options from the bot config API — full list for the category
    const [botNameOptions, setBotNameOptions] = useState<{ value: string; label: string }[]>([]);

    // Fetch all bots in this category once on mount to populate the Bot Name dropdown
    useEffect(() => {
        if (!bot_category || !selectedOrg) return;
        botConfigApi.getBotConfig({
            org_name: selectedOrg,
            bot_category: bot_category,
        }).then((res) => {
            const bots: any[] = res?.data?.response_body ?? [];
            const options = Array.from(
                new Set(bots.map((b: any) => b.bot_name).filter(Boolean))
            )
                .sort()
                .map((name) => ({ value: name as string, label: name as string }));
            setBotNameOptions(options);
        }).catch(() => {
            // Silently fail — dropdown will fall back to page-data options
        });
    }, [bot_category, selectedOrg]);

    // Recompute columns whenever tableData or botNameOptions changes
    const columns = useMemo(
        () => CateoColumn(bot_category || "", tableData, botNameOptions),
        [tableData, bot_category, botNameOptions]
    );

    const table = useReactTable({
        data: tableData,
        columns,
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

    // Debounce the global search value
    const globalSearchValue = (table.getState().globalFilter as string) ?? "";
    const debouncedGlobalSearch = useDebounce(globalSearchValue, 500);
    const prevDebouncedSearchRef = useRef<string>(debouncedGlobalSearch);

    // Get date range filter value from the "created_on" column (set by the date picker in the toolbar)
    const dateRangeFilterValue = table.getColumn("created_on")?.getFilterValue() as
        | { from: string; to?: string | undefined }
        | undefined;

    // Stable key — only changes when BOTH from & to are present, preventing partial-update re-fetches
    const dateRangeKey = useMemo(() => {
        if (!dateRangeFilterValue?.from) return null;
        return dateRangeFilterValue.to
            ? `${dateRangeFilterValue.from}-${dateRangeFilterValue.to}`
            : dateRangeFilterValue.from;
    }, [dateRangeFilterValue?.from, dateRangeFilterValue?.to]);

    // Resolved active date range from column filter
    const activeDateRange = useMemo(() => {
        if (dateRangeFilterValue?.from && dateRangeFilterValue?.to) {
            return { from: dateRangeFilterValue.from, to: dateRangeFilterValue.to };
        }
        return { from: "", to: "" };
    }, [dateRangeFilterValue]);

    // Reset offset to 0 when search changes
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

    // Get bot_name multiSelect filter value from the column
    const botNameFilter = table.getColumn("bot_name")?.getFilterValue() as string[] | undefined;

    // Reset offset when bot_name filter changes
    const prevBotNameRef = useRef<string>("[]");
    useEffect(() => {
        const key = JSON.stringify(botNameFilter ?? []);
        if (prevBotNameRef.current !== key) {
            setOffset(0);
            prevBotNameRef.current = key;
        }
    }, [botNameFilter]);

    const fetchBotExecutionLog = useCallback(async () => {
        setIsLoading(true);
        try {
            const botStatusFilter = columnFilters.find(
                (f) => f.id === "bot_status"
            )?.value as string[];

            // Payload mirrors dynamic-bot-pages.tsx but passes bot_category instead of bot_name
            const payload = {
                org_name: selectedOrg,
                global_search: debouncedGlobalSearch,
                search_params: {
                    bot_category: bot_category,
                    ...(botNameFilter?.length && { bot_name: botNameFilter }),
                    bot_status: botStatusFilter?.length
                        ? botStatusFilter
                        : bot_status
                            ? [bot_status]
                            : [],
                    ...(activeDateRange.from && activeDateRange.to && {
                        created_on: {
                            from: activeDateRange.from,
                            to: activeDateRange.to,
                        },
                    }),
                },
                return_bot_fields: ["all"],
                offset: offset,
                limit: limit,
            };

            const res = await botExecutionService.getBotCategoryExecutionLog(payload);

            if (res?.data?.response_body) {
                setTableData(res.data.response_body.data);
                if (res.data.response_body.no_of_rows !== undefined) {
                    setTotalCount(res.data.response_body.no_of_rows);
                }
            } else {
                setTableData([]);
                setTotalCount(0);
            }

            if (res.error) {
                // toast.error(res.error);
            }
        } catch (err) {
            toast.error("Failed to fetch Bot Execution Log");
            console.error(err);
            setTableData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    }, [selectedOrg, bot_category, bot_status, activeDateRange, botNameFilter, offset, limit, debouncedGlobalSearch, columnFilters]);

    const handleBackClick = () => {
        // Navigate back to the category-level dashboard preserving context
        navigate(
            `/dashboard-category?category=${encodeURIComponent(bot_category || "")}`
        );
    };

    // Initial fetch when dependencies change
    useEffect(() => {
        if (bot_category) {
            fetchBotExecutionLog();
        }
    }, [fetchBotExecutionLog, bot_category]);



    useEffect(() => {
        console.log(tableData, "tableData (category)");
    }, [tableData]);

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
                        <h1 className="font-semibold text-xl">{bot_category}</h1>
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

export default DynamicCatoPage;
