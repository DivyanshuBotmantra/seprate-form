import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";

import ViewDashBoardConfig from "./sheet/view-dashboard-config-sheet";
import EditDashBoardConfig from "./sheet/edit-dashboard-config-sheet";
import { Dashboarduserconfig } from "./sheet/dashbaord-user-config-sheet";
import { StatusBadge } from "../common/status-badge";


// ---------- TYPE ----------
export type DashboardConfigType = {
  org_name: string;
  dashboard_name: string;
  dashboard_config_json: Record<string, any>;
  dashboard_url: string;
  dashboard_status: "ACTIVE" | "INACTIVE";
};



// ---------- COLUMNS ----------
const DashboardConfigColumn = (
  refreshTable: () => void,
  openDashboardUserSheet?: (dashboardName: string) => void,
  isSuper: boolean = false
): ColumnDef<DashboardConfigType>[] => {
  const columns: ColumnDef<DashboardConfigType>[] = [
    {
      accessorKey: "dashboard_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Dashboard Name" />
      ),
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate">
          {row.getValue("dashboard_name")}
        </div>
      ),
      enableSorting: true,
      enableHiding: false,
    },

    {
      accessorKey: "dashboard_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("dashboard_status") as string;
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

    // Conditionally add Actions column only for SUPER ADMIN
    ...(isSuper
      ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }: any) => {
            const data = row.original;

            return (
              <div className="flex gap-2">
                <ViewDashBoardConfig data={data} />
                <EditDashBoardConfig
                  data={data}
                  refreshTable={refreshTable}
                />
              </div>
            );
          },
        } as ColumnDef<DashboardConfigType>,
      ]
      : []),

    {
      id: "assign",
      header: "Assign",
      cell: ({ row }) => {
        const data = row.original;

        return <Dashboarduserconfig data={data} />;
      },
    },
  ];

  return columns;
};

export default DashboardConfigColumn;
