import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import { BotStatusBadge } from "@/components/common/status-badge";
import TaskPreviewBtn from "./task-preview-btn";
import { formatDateTime } from "@/lib/format";

export type TaskExecutionLog = {
  task_id: string;
  task_code: string;
  list_param: Record<string, any>;
  wf_transaction_ref_id: string | null;
  source_type: string | null;
  source_id: string | null;
  bot_status: string | null;
  trans_status: string;
  created_by: string;
  created_on: string;
  updated_by: string | null;
  updated_on: string | null;
};

// Helper function to get all unique keys from list_param across all data
const getListParamKeys = (data: TaskExecutionLog[]): string[] => {
  const keysSet = new Set<string>();
  data.forEach((item) => {
    if (item.list_param) {
      Object.keys(item.list_param).forEach((key) => keysSet.add(key));
    }
  });
  const keys = Array.from(keysSet);
  return keys;
};

// Generate columns dynamically based on list_param keys
const TaskExecutionLogColumn = (
  data: TaskExecutionLog[] = []
): ColumnDef<TaskExecutionLog>[] => {
  const listParamKeys = getListParamKeys(data);

  const staticColumns: ColumnDef<TaskExecutionLog>[] = [
    {
      accessorKey: "task_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task ID" />
      ),
      cell: ({ row }) => <div className="">{row.getValue("task_id")}</div>,
      enableSorting: true,
      enableHiding: true,
    },
  ];

  // Create dynamic columns for each list_param key
  const dynamicColumns: ColumnDef<TaskExecutionLog>[] = listParamKeys.map(
    (key) => ({
      id: `list_param_${key}`,
      accessorFn: (row) => row.list_param?.[key] || "-",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={key} />
      ),
      cell: ({ row }) => {
        const value = row.original.list_param?.[key];
        return <div className="">{value || "-"}</div>;
      },
      enableSorting: true,
      enableHiding: true,
    })
  );

  const endColumns: ColumnDef<TaskExecutionLog>[] = [
    {
      accessorKey: "trans_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("trans_status") as string;
        return <BotStatusBadge status={status} />;
      },
      enableSorting: true,
      enableHiding: true,
      meta: {
        variant: "multiSelect",
        label: "Status",
        placeholder: "Select status",

        options: [
          { value: "PENDING", label: "Pending" },
          { value: "IN-PROGRESS", label: "In Progress" },
          { value: "SUBMITTED", label: "Submitted" },
          { value: "REJECTED", label: "Rejected" },
        ],
      },
    },
    {
      accessorKey: "created_by",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created By" />
      ),
      cell: ({ row }) => <div className="">{row.getValue("created_by")}</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "created_on",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created On" />
      ),
      cell: ({ row }) => (
        <div className="">{formatDateTime(row.getValue("created_on"))}</div>
      ),
      enableSorting: true,
      enableHiding: true,
      meta: {
        variant: "dateRange",
        label: "Created On",
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex">
            <TaskPreviewBtn data={row.original} />
          </div>
        );
      },
    },
  ];

  return [...staticColumns, ...dynamicColumns, ...endColumns];
};

export default TaskExecutionLogColumn;
