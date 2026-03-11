import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import EmailConfigViewSheet from "./sheet/view-email-sheet";
import EmailConfigUpdateSheet from "./sheet/update-email-sheet";

export type EmailConfigItem = {
    org_name: string;
    email_name: string;
    email_credentials: Record<string, any> | string;
    email_subject: string;
    email_body: string;
};

const EmailConfigColumns = (refreshTable: () => void): ColumnDef<EmailConfigItem>[] => [
    {
        accessorKey: "email_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Email Name" />
        ),
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("email_name")}</div>
        ),
    },
    {
        accessorKey: "email_subject",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Subject" />
        ),
        cell: ({ row }) => {
            const subject = row.getValue("email_subject") as string;
            return (
                <div className="max-w-[300px] truncate" title={subject}>
                    {subject}
                </div>
            );
        },
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-2">
                    <EmailConfigViewSheet data={row.original} />
                    <EmailConfigUpdateSheet
                        data={row.original}
                        refreshTable={refreshTable}
                    />
                </div>
            );
        },
    },
];

export default EmailConfigColumns;
