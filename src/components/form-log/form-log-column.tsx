import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import { BotStatusBadge } from "@/components/common/status-badge";
import { exactArrayFilter } from "@/lib/table-filters";
import { formatDateTime } from "@/lib/format";
import FormLogViewSheet from "./sheet/form-log-view-sheet";

export type FormLog = {
    form_execution_id: string;
    form_code: string;
    form_status: string;
    bot_status: string;
    created_by: string;
    updated_by: string;
    created_on: string;
    updated_on: string;
    form_data: any;
};

const FormLogColumn = (form_name: string): ColumnDef<FormLog>[] => {
    return [
        {
            accessorKey: "form_execution_id",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Form Execution ID" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("form_execution_id");
                return (
                    <div className="">
                        {value ? (
                            String(value)
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground " />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "form_status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Form Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("form_status") as string;
                if (!status) {
                    return (
                        <div className="">
                            <div className="w-4 h-px bg-muted-foreground " />
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
                label: "Form Status",
                placeholder: "Select status",
                options: [
                    { value: "INITIATED", label: "Initiated" },
                    { value: "IN-PROGRESS", label: "In Progress" },
                    { value: "SUCCEEDED", label: "Succeeded" },
                    { value: "FAILED", label: "Failed" },
                ],
            },
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
                        <div className="">
                            <div className="w-4 h-px bg-muted-foreground " />
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
                label: "Bot Status",
                placeholder: "Select status",
                options: [
                    { value: "INITIATED", label: "Initiated" },
                    { value: "IN-PROGRESS", label: "In Progress" },
                    { value: "SUCCEEDED", label: "Succeeded" },
                    { value: "FAILED", label: "Failed" },
                ],
            },
        },
        {
            accessorKey: "created_by",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Created By" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("created_by");
                return (
                    <div className="">
                        {value ? (
                            String(value)
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground " />
                        )}
                    </div>
                );
            },
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
                return (
                    <div className="">
                        {value ? (
                            formatDateTime(String(value))
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground " />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: "updated_on",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Updated On" />
            ),
            cell: ({ row }) => {
                const value = row.getValue("updated_on");
                return (
                    <div className="">
                        {value ? (
                            formatDateTime(String(value))
                        ) : (
                            <div className="w-4 h-px bg-muted-foreground " />
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                return (
                    <div className="flex">
                        <FormLogViewSheet data={row.original} form_name={form_name} />
                    </div>
                );
            },
        },
    ];
};

export default FormLogColumn;
