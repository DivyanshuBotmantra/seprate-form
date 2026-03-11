import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/common/table/data-table-header";
import { Badge } from "@/components/ui/badge";
import { CellView } from "./sheet/user-view-sheet";
import { UserCellAction } from "./sheet/user-edit-sheet";
import { useUserEditFields } from "./user-edit-fields";
import { useUserStore } from "@/lib/store/user-store";
import { toast } from "sonner";
import { StatusBadge } from "../common/status-badge";

export type User = {
  id?: number;
  user_id: string;
  name: string;
  email?: string;
  role: string;
  status?: string;
  user_status?: string;
  org_name?: string[];
  it_dashboard_visibility?: boolean;
  [key: string]: any; // Allow additional properties
};

const userViewFields = [
  {
    key: "name",
    label: "Full Name",
    type: "text" as const,
  },
  {
    key: "user_id",
    label: "User ID",
    type: "email" as const,
  },
  {
    key: "role",
    label: "Role",
    type: "badge" as const,
    badgeVariant: "outline" as const,
  },
  {
    key: "user_status",
    label: "Status",
    type: "badge" as const,
  },
  {
    key: "org_name",
    label: "Organizations",
    type: "array" as const,
  },
  {
    key: "it_dashboard_visibility",
    label: "IT Dashboard Visibility",
    type: "badge" as const,
    formatter: (val: any) => (
      <Badge variant={val === true || val === "true" ? "default" : "secondary"}>
        {val === true || val === "true" ? "True" : "False"}
      </Badge>
    ),
  },
];

const UserColumn = (): ColumnDef<User>[] => {
  return [
    {
      accessorKey: "user_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => <div className="">{row.getValue("user_id")}</div>,
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => <div className="">{row.getValue("name")}</div>,
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "org_name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Org" />
      ),
      cell: ({ row }) => {
        const orgs = row.getValue("org_name") as string[] | undefined;

        return (
          <div className="">
            {Array.isArray(orgs) && orgs.length > 0 ? orgs.join(", ") : "—"}
          </div>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },

    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue("role") as string;
        return (
          <Badge variant={role === "Admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        );
      },
      enableSorting: true,
      enableHiding: true,
    },
    {
      accessorKey: "user_status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue("user_status") as string;
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
        const fields = useUserEditFields();
        const updateUserAndRefresh = useUserStore(
          (state) => state.updateUserAndRefresh
        );

        const handleUserSave = async (updatedData: Partial<User>) => {
          const payload = {
            search_fields: {
              user_id: row.original.user_id,
            },
            update_fields: {
              name: updatedData.name ?? undefined,
              role: updatedData.role ?? undefined,
              user_status:
                updatedData.status ?? updatedData.user_status ?? undefined,
              org_name: updatedData.org_name ?? undefined,
              it_dashboard_visibility: updatedData.it_dashboard_visibility !== undefined 
                ? (String(updatedData.it_dashboard_visibility) === "true") 
                : undefined,
            },
          };

          const res = await updateUserAndRefresh(payload as any);
          console.log("UPDATE PAYLOAD:", payload);
          console.log("UPDATE RESPONSE:", res);

          const resData = res?.data as any;
          if (resData?.status_code === 200) {
            toast.success("User Updated");
            return res;
          }

          if (res?.error) {
            toast.error(`Failed to update user: ${res.error}`);
            throw new Error(res.error);
          }

          return res;
        };

        return (
          <div>
            <CellView
              data={row.original}
              title="User Details"
              description="View detailed information about this user."
              fields={userViewFields}
              getDisplayName={(data) => data.name}
              getDisplayId={(data) => data.user_id}
            />
            <UserCellAction
              data={row.original}
              title="Edit User"
              description="Make changes to the user profile."
              fields={fields}
              onSave={handleUserSave}
              getDisplayName={(data) => data.name}
              excludeFields={["password"]}
              getDisplayId={(data) => data.user_id}
            />
          </div>
        );
      },
    },
  ];
};

export default UserColumn;
