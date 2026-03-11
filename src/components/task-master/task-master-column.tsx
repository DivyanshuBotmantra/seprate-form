import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import { StatusBadge } from "../common/status-badge";

import TaskMasterViewSheet from "./sheet/view-task-master";
import TaskMasterEditSheet from "./sheet/edit-task-master-sheet";
import { TaskMasterUserSheet } from "./sheet/assign-task-user-sheet";

export type TaskMasterColumnType = {
  org_name: string;
  task_code: string;
  task_name: string;
  task_category: string;
  task_status: string;
  task_form_json?: any;
};

const TaskMasterColumn = (
  refreshTable: () => void,
  isSuper: boolean = false
): ColumnDef<TaskMasterColumnType>[] => {
  const columns: ColumnDef<TaskMasterColumnType>[] = [
    {
      accessorKey: "task_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Code" />
      ),
      cell: ({ row }) => <div className="">{row.getValue("task_code")}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "task_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Name" />
      ),
      cell: ({ row }) => <div>{row.getValue("task_name")}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "task_category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Task Category" />
      ),
      cell: ({ row }) => (
        <div className="">{row.getValue("task_category")}</div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "task_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("task_status") as string;
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
                  <TaskMasterViewSheet data={data} />
                  <TaskMasterEditSheet
                    data={data}
                    refreshTable={refreshTable}
                  />
                </div>
              );
            },
          } as ColumnDef<TaskMasterColumnType>,
        ]
      : []),

    // ---------- ASSIGN (VISIBLE TO ALL) ----------
    {
      id: "assign",
      header: "Assign",
      cell: ({ row }) => {
        const data = row.original;
        return (
          <div className="flex flex-row gap-2">
            <TaskMasterUserSheet data={data} />
          </div>
        );
      },
    },
  ];

  return columns;
};

export default TaskMasterColumn;
