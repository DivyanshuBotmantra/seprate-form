import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import ViewSheetCategory from "./sheet/view_sheet_cateogry";
import { BotStatusBadge } from "@/components/common/status-badge";
import { exactArrayFilter } from "@/lib/table-filters";
import { formatDateTime } from "@/lib/format";

export type CategoryRow = {
    id?: number;
    bot_name?: string;
    bot_code?: string;
    bot_category?: string;
    bot_status?: string;
    list_param?: Record<string, any>;
    [key: string]: any;
};

// Collect all unique keys from list_param across all rows, sorted alphabetically
const getListParamKeys = (data: CategoryRow[]): string[] => {
    const keysSet = new Set<string>();
    data.forEach((item) => {
        if (item.list_param && typeof item.list_param === "object") {
            Object.keys(item.list_param).forEach((key) => keysSet.add(key));
        }
    });
    return Array.from(keysSet).sort((a, b) => a.localeCompare(b));
};

const CateoColumn = (
    bot_category: string,
    data: CategoryRow[] = [],
    botNameOptions: { value: string; label: string }[] = []
): ColumnDef<CategoryRow>[] => {
    const listParamKeys = getListParamKeys(data);

    // Use pre-fetched options from the bot config API.
    // Fall back to extracting unique names from current page data if none provided.
    const resolvedBotNameOptions = botNameOptions.length > 0
        ? botNameOptions
        : Array.from(new Set(data.map((row) => row.bot_name).filter(Boolean)))
            .sort()
            .map((name) => ({ value: name as string, label: name as string }));

    // Static columns — bot_name is the primary identifier for each row
    const staticColumns: ColumnDef<CategoryRow>[] = [
        {
            accessorKey: "bot_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Bot Name" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("bot_name");
                return (
                    <div className="font-medium">
                        {value ? String(value) : <div className="w-4 h-px bg-muted-foreground" />}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
            filterFn: exactArrayFilter,
            meta: {
                variant: "multiSelect",
                label: "Bot Name",
                placeholder: "Select bot name",
                options: resolvedBotNameOptions,
            },
        },
    ];

    // Dynamic columns — one per list_param key found in the data
    const dynamicColumns: ColumnDef<CategoryRow>[] = listParamKeys.map((key) => ({
        id: `list_param_${key}`,
        accessorFn: (row) => row.list_param?.[key] ?? "-",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title={key} />
        ),
        cell: ({ row }) => {
            const value = row.original.list_param?.[key];
            return <div>{value != null ? String(value) : "-"}</div>;
        },
        enableSorting: true,
        enableHiding: true,
    }));

    // End columns — date fields + status + actions
    const endColumns: ColumnDef<CategoryRow>[] = [
        {
            accessorKey: "created_on",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created On" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("created_on");
                return (
                    <div>
                        {value ? (
                            formatDateTime(String(value))
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground" />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
            meta: {
                variant: "dateRange",
                label: "Created On",
            },
        },
        {
            accessorKey: "bot_start_time",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Bot Start Time" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("bot_start_time");
                return (
                    <div>
                        {value ? (
                            formatDateTime(String(value))
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground" />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "bot_end_time",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Bot End Time" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("bot_end_time");
                return (
                    <div>
                        {value ? (
                            formatDateTime(String(value))
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground" />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "created_by",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created By" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("created_by");
                return (
                    <div>
                        {value ? String(value) : <div className="w-4 h-px bg-muted-foreground" />}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "bot_status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Bot Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("bot_status") as string;
                if (!status) {
                    return (
                        <div>
                            <div className="w-4 h-px bg-muted-foreground" />
                        </div>
                    );
                }
                return <BotStatusBadge status={status} />;
            },
            enableSorting: true,
            enableHiding: true,
            filterFn: exactArrayFilter,
            meta: {
                variant: "multiSelect",
                label: "Status",
                placeholder: "Select status",
                options: [
                    { value: "INITIATED", label: "INITIATED" },
                    { value: "IN-PROGRESS", label: "IN-PROGRESS" },
                    { value: "SUCCEEDED", label: "SUCCEEDED" },
                    { value: "FAILED", label: "FAILED" },
                ],
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex">
                    <ViewSheetCategory data={row.original} bot_category={bot_category} />
                </div>
            ),
        },
    ];

    return [...staticColumns, ...dynamicColumns, ...endColumns];
};

export default CateoColumn;
