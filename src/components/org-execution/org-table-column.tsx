import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import { BotStatusBadge } from "@/components/common/status-badge";
import { exactArrayFilter } from "@/lib/table-filters";
import { formatDateTime } from "@/lib/format";
import OrgExecutionViewSheet from "./org-execution-view-sheet";

export type OrgExecutionLog = {
    record_id: string;
    machine_group: string;
    machine_name: string;
    created_on: string;
    bot_start_time: string;
    bot_end_time: string;
    status: string;
    source?: string;
};

const OrgExecutionColumn = (): ColumnDef<OrgExecutionLog>[] => {
    return [
        {
            accessorKey: "record_id",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Record Id" />
            ),
            cell: ({ row }) => <div className="font-mono text-xs">{row.getValue("record_id")}</div>,
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "machine_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Machine Name" />
            ),
            cell: ({ row }) => row.getValue("machine_name"),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "created_on",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created On" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("created_on");
                return value ? formatDateTime(String(value)) : <div className="w-4 h-px bg-muted-foreground" />;
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
                return value ? formatDateTime(String(value)) : <div className="w-4 h-px bg-muted-foreground" />;
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
                return value ? formatDateTime(String(value)) : <div className="w-4 h-px bg-muted-foreground" />;
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
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
                    { value: "Succeeded", label: "Succeeded" },
                    { value: "Failed", label: "Failed" },
                ],
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="flex">
                        <OrgExecutionViewSheet data={row.original} />
                    </div>
                );
            },
        },
    ];
};

export default OrgExecutionColumn;

