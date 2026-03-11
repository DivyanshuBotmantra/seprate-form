import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import TbReconViewSheet from "./sheet/tb-recon-view-sheet";
import { BotStatusBadge } from "@/components/common/status-badge";
import { exactArrayFilter } from "@/lib/table-filters";
import { formatDateTime } from "@/lib/format";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  bot_name: string;
  bot_execution_id?: string;
  list_param?: Record<string, any>;
  [key: string]: any;
};

const CopyableId = ({ id, last4 }: { id: string; last4: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    toast.success("ID Copied", {
      description: id,
      duration: 2000,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 group">
      <div
        className="flex items-center bg-muted/50 hover:bg-muted border border-border/50 rounded-md px-1.5 py-0.5 transition-all cursor-default"
        title={id}
      >
        <code className="text-[10px] font-mono font-bold text-foreground/80 lowercase">
          ......{last4}
        </code>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary active:scale-90"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-600 animate-in zoom-in duration-200" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
};

// Helper: collect all unique keys from list_param across all rows, sorted alphabetically
const getListParamKeys = (data: User[]): string[] => {
  const keysSet = new Set<string>();
  data.forEach((item) => {
    if (item.list_param && typeof item.list_param === "object") {
      Object.keys(item.list_param).forEach((key) => keysSet.add(key));
    }
  });
  return Array.from(keysSet).sort((a, b) => a.localeCompare(b));
};


interface TbReconColumnProps {
  bot_name: string;
  data?: User[];
  activeSheetExecutionId: string | null;
  onSheetOpenChange: (id: string | null) => void;
}

const TbReconColumn = ({ bot_name, data = [], activeSheetExecutionId, onSheetOpenChange }: TbReconColumnProps): ColumnDef<User>[] => {
  const listParamKeys = getListParamKeys(data);

  // Static columns — ID first
  const staticColumns: ColumnDef<User>[] = [
    {
      accessorKey: "bot_execution_id",
      size: 130,
      minSize: 130,
      maxSize: 130,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="ID"
          className="justify-center ml-0"
        />
      ),
      cell: ({ row }) => {
        const id = row.original.bot_execution_id;
        if (!id)
          return (
            <div className="w-full flex justify-center pr-6">
              <div className="w-4 h-px bg-muted-foreground" />
            </div>
          );
        const last4 = String(id).slice(-4);
        return (
          <div className="w-full flex justify-center pr-6">
            <CopyableId id={String(id)} last4={last4} />
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
  ];

  // Dynamic columns — one per list_param key found in the data
  const dynamicColumns: ColumnDef<User>[] = listParamKeys.map((key) => ({
    id: `list_param_${key}`,
    accessorFn: (row) => row.list_param?.[key] ?? "-",
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={key}
        className="ml-0"
      />
    ),
    cell: ({ row }) => {
      const value = row.original.list_param?.[key];
      if (!value || value === "-") return <div className="pl-0.5">-</div>;

      // If it's the ETA field, format it as a date
      if (key.toUpperCase() === "ETA") {
        return <div className="pl-0.5">{formatDateTime(String(value))}</div>;
      }

      return <div className="pl-0.5">{String(value)}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  }));

  // End columns — date fields + status + actions (appear after dynamic list_param columns)
  const endColumns: ColumnDef<User>[] = [
    {
      accessorKey: "created_on",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Created On"
          className="ml-0"
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue("created_on");
        return (
          <div className="pl-0.5">
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
      meta: {
        variant: "dateRange",
        label: "Created On",
      },
    },
    {
      accessorKey: "bot_start_time",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Bot Start Time"
          className="ml-0"
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue("bot_start_time");
        return (
          <div className="pl-0.5">
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
      accessorKey: "bot_end_time",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Bot End Time"
          className="ml-0"
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue("bot_end_time");
        return (
          <div className="pl-0.5">
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
        <DataTableColumnHeader
          column={column}
          title="Created By"
          className="ml-0"
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue("created_by");
        return (
          <div className="pl-0.5">
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
      accessorKey: "bot_status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Bot Status"
          className="justify-center ml-0"
        />
      ),
      cell: ({ row }) => {
        const status = row.getValue("bot_status") as string;
        if (!status) {
          return (
            <div className="w-full flex justify-center pr-6">
              <div className="w-4 h-px bg-muted-foreground" />
            </div>
          );
        }
        return (
          <div className="w-full flex justify-center pr-6">
            <BotStatusBadge status={status} />
          </div>
        );
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
      header: () => <div className="text-center w-full">Actions</div>,
      size: 80,
      cell: ({ row }) => {
        const executionId = row.original.bot_execution_id ?? "";
        const isOpen = activeSheetExecutionId === executionId;

        return (
          <TbReconViewSheet
            data={row.original}
            bot_name={bot_name}
            open={isOpen}
            executionId={executionId}
            onOpenChange={(open: boolean) => {
              onSheetOpenChange(open ? executionId : null);
            }}
          />
        );
      },
    },
  ];

  return [...staticColumns, ...dynamicColumns, ...endColumns];
};

export default TbReconColumn;
