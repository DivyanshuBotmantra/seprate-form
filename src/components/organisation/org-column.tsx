import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import OrgViewSheet from "./sheet/org-view-sheet";
import OrgEditSheet from "./sheet/org-edit-sheet";
import OrgCredsheet from "./sheet/org-cred-sheet";
import { StatusBadge } from "../common/status-badge";

interface Org {
  org_name: string;
  org_status: string;
}

// ✅ function takes a function, not an object
export const orgColumn = (
  refresh: () => void
): ColumnDef<Org>[] => [
    {
      accessorKey: "org_name",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="font-semibold">Organisation</span>
          <ArrowUpDown className="h-4 w-4 opacity-60" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="w-20">{row.getValue("org_name")}</div>
      ),
    },

    {
      accessorKey: "org_status",
      header: ({ column }) => (
        <div
          onClick={column.getToggleSortingHandler()}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="font-semibold">Status</span>
          <ArrowUpDown className="h-4 w-4 opacity-60" />
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue("org_status") as string;
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
      header: () => <span className="font-semibold">Actions</span>,
      cell: ({ row }) => {
        const data = row.original;

        return (
          <div className="flex items-center gap-3">
            <OrgViewSheet data={data} />
            <OrgEditSheet data={data} refresh={refresh} />
          </div>
        );
      },
      size: 80,
    },

    {
      id: "cred",
      header: () => <span className="font-semibold">Credentials</span>,
      cell: ({ row }) => {
        const data = row.original;

        return (
          <div className="flex items-center justify-start">
            <OrgCredsheet data={data} refresh={refresh} />
          </div>
        );
      },
      size: 60,
    },
  ];
