import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";

import { StatusBadge } from "../common/status-badge";
import FormMasterViewSheet from "./sheet/view-form-master";
import FormMasterEditSheet from "./sheet/edit-form-master-sheet";
import { FormMasterUserSheet } from "./sheet/user-form-master-sheet";
// import { EmailConfigSheet } from "./sheet/email-config-form-master";


export type FormMasterColumnType = {
    org_name: string;
    form_code: string;
    form_name: string;
    form_category: string;
    bot_trigger?: boolean;
    bot_code?: string;
    sidebar_visibility?: boolean;
    form_status: string;
    form_json?: any;
    email_flag?: boolean;
    file_trigger_flag?: boolean;
};

const FormMasterColumn = (
    refreshTable: () => void,
    isSuper: boolean = false
): ColumnDef<FormMasterColumnType>[] => {
    const columns: ColumnDef<FormMasterColumnType>[] = [
        {
            accessorKey: "form_code",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Form Code" />
            ),
            cell: ({ row }) => (
                <div className="w-28">{row.getValue("form_code")}</div>
            ),
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "form_name",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Form Name" />
            ),
            cell: ({ row }) => <div>{row.getValue("form_name")}</div>,
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "form_category",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Form Category" />
            ),
            cell: ({ row }) => (
                <div className="w-32">{row.getValue("form_category")}</div>
            ),
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: "form_status",
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Status" />
            ),
            cell: ({ row }) => {
                const status = row.getValue("form_status") as string;
                return <StatusBadge status={status} />;
            },
            enableSorting: true,
            enableHiding: true,
            meta: {
                variant: "select",
                label: "Status",
                placeholder: "Select status",
                options: [
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                ],
            },
        },

        // ---------- ACTIONS (SUPER ADMIN ONLY) ----------
        ...(isSuper
            ? [
                {
                    id: "actions",
                    header: "Actions",
                    cell: ({ row }) => {
                        const data = row.original;
                        return (
                            <div className="flex flex-row gap-2">
                                <FormMasterViewSheet data={data} />
                                <FormMasterEditSheet
                                    data={data}
                                    refreshTable={refreshTable}
                                />
                            </div>
                        );
                    },
                } as ColumnDef<FormMasterColumnType>,
            ]
            : []),

        // ---------- ASSIGN (VISIBLE TO ALL) ----------
        {
            id: "assign",
            header: "Assign",
            cell: ({ row }) => {
                const data = row.original;
                return <FormMasterUserSheet data={data} />;
            },
        },
    ];

    return columns;
};


export default FormMasterColumn;
