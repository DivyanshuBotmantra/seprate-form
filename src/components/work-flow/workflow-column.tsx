import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";

import ViewWorkFlow from "./sheet/view-workflow-sheet";
import WorkFlowEditSheet from "./sheet/edit-workflow-sheet";
import { StatusBadge } from "../common/status-badge";

export type WorkFlowColumntype = {
  dashboard_name: string;
  dashboard_status: string;
};

const WorkFlowColumn = (refreshTable): ColumnDef<WorkFlowColumntype>[] => {
  return [
    {
      accessorKey: "wf_code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WF Code" />
      ),
      cell: ({ row }) => <div className="w-20">{row.getValue("wf_code")}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "wf_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WF Name" />
      ),
      cell: ({ row }) => <div className="w-20">{row.getValue("wf_name")}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "wf_category",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="WF Category" />
      ),
      cell: ({ row }) => (
        <div className="w-20">{row.getValue("wf_category")}</div>
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "wf_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("wf_status") as string;

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
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const data = row.original;

        return (
          <div className="flex flex-row gap-2">
            <ViewWorkFlow data={data} />
            <WorkFlowEditSheet data={data} refreshTable={refreshTable} />
          </div>
        );
      },
    },
  ];
};

export default WorkFlowColumn;
