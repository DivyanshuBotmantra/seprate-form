import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import BotconfigViewSheet from "./sheet/Botconfig-view-sheet";
import BotconfigEditsheet from "./sheet/Botconfig-edit-sheet";
import BotConfigMasterFilesSheet from "./sheet/master-file-mangem-sheet";
import { BotUserSheet } from "./sheet/bot-user-sheet";
import { StatusBadge } from "../common/status-badge";

export type BotConfigType = {
  org_name: string;
  bot_code: string;
  bot_name: string;
  bot_category: string;
  master_files: Record<string, any> | null;
  master_file_folder_path: string | null;
  master_file_credential: Record<string, any> | null;
  storage_encryption: boolean;
  bot_status: "ACTIVE" | "INACTIVE";
};

const BotconfigColumn = (
  refreshTable: () => void,
  isSuper: boolean = false
): ColumnDef<BotConfigType>[] => {
  const columns: ColumnDef<BotConfigType>[] = [
    {
      accessorKey: "bot_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bot Code" />
      ),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("bot_code")}</div>
      ),
      enableSorting: true,
      enableHiding: false,
    },

    {
      accessorKey: "bot_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bot Name" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">{row.getValue("bot_name")}</div>
      ),
      enableSorting: true,
      enableHiding: false,
    },

    {
      accessorKey: "bot_category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Bot Category" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[160px] truncate">
          {row.getValue("bot_category")}
        </div>
      ),
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "bot_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("bot_status") as "ACTIVE" | "INACTIVE";
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
                <div className="flex gap-2">
                  <BotconfigViewSheet data={data} />
                  <BotconfigEditsheet data={data} refreshTable={refreshTable} />
                </div>
              );
            },
          } as ColumnDef<BotConfigType>,
        ]
      : []),

    // ---------- MASTER FILES (ADMIN + SUPER ADMIN) ----------
    {
      id: "file",
      header: "Master File",
      cell: ({ row }) => {
        const data = row.original;
        return (
          <BotConfigMasterFilesSheet data={data} refreshTable={refreshTable} />
        );
      },
    },

    // ---------- ASSIGN USERS (ADMIN + SUPER ADMIN) ----------
    {
      id: "assign",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Assign" />
      ),
      cell: ({ row }) => {
        const data = row.original;
        return <BotUserSheet data={data} />;
      },
    },
  ];

  return columns;
};

export default BotconfigColumn;
