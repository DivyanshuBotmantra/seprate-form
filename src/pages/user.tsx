import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { toast } from "sonner";
import { DataTable } from "@/components/common/table/data-table";
import { useUserStore } from "@/lib/store/user-store";
import { useOrgStore } from "@/lib/store/org-store";
import { createUser } from "@/services/user/user";
import UserColumn from "@/components/users/user-column";
import { UserCreateSheet } from "@/components/users/sheet/create-user-sheet";

type User = {
  user_id: string;
  name: string;
  role: string;
  user_status: string;
  org_name: string[];
};
const User = () => {
  const users = useUserStore((state) => state.users);
  const fetchUsers = useUserStore((state) => state.fetchUsers);
  const orgs = useOrgStore((state) => state.orgs);
  const fetchOrgs = useOrgStore((state) => state.fetchOrgs);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleCreateUser = async (payload: any) => {
    try {
      setLoading(true);
      const res = await createUser(payload);

      if (res.error) {
        toast.error(res.error);
        return res; // ✅ Return response so sheet can check
      } else {
        toast.success("User created successfully");
        fetchUsers();
        return res; // ✅ Return response so sheet can check
      }
    } catch (err) {
      toast.error("Something went wrong");
      return { data: null, error: "Something went wrong" }; 
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
    fetchOrgs();
  }, []);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const globalFilterFn = (
    row: Row<User>,
    _columnId: string,
    filterValue: string
  ) => {
    const search = String(filterValue).toLowerCase();
    const searchOriginal = String(filterValue); // Keep original case for user_status

    const { name, user_id, role, org_name, user_status } = row.original;
    return (
      (name && String(name).toLowerCase().includes(search)) ||
      (user_id && String(user_id).toLowerCase().includes(search)) ||
      (role && String(role).toLowerCase().includes(search)) ||
      (org_name && String(org_name).toLowerCase().includes(search)) ||
      (user_status && String(user_status).includes(searchOriginal))
      // (org?.name && String(org.name).toLowerCase().includes(search))
    );
  };

  const table = useReactTable({
    data: users,
    columns: UserColumn(),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableRowPinning: true,
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
  });

  return (
    <DataTable table={table}>
      <div className="px-3 pt-2">
        <h1 className="font-semibold text-xl">Manage Users</h1>
      </div>
      <DataTableToolbar
        table={table}
        excludeColumns={["actions"]}
        createButton={{
          label: "Create User",
          onClick: () => setSheetOpen(true),
          visible: true,
        }}
      />
      <UserCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create User"
        orgList={orgs}
        onSubmit={handleCreateUser}
        loading={loading}
      />
    </DataTable>
  );
};

export default User;
