import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { orgColumn } from "@/components/organisation/org-column";
import { OrganisationCreateSheet } from "@/components/organisation/sheet/organisation-sheet";
import { useOrgStore } from "@/lib/store/org-store";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from "@tanstack/react-table";

const Organisations = () => {
  const fetchOrgs = useOrgStore((s) => s.fetchOrgs);
  const createOrg = useOrgStore((s) => s.createOrg);
  const orgs = useOrgStore((s) => s.orgs);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ------------------------------
  // Fetch organisations
  // ------------------------------
  const refreshTable = useCallback(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  useEffect(() => {
    refreshTable();
  }, [refreshTable]);

  // ------------------------------
  // Handle Create Organisation
  // ------------------------------
  const handleCreateOrganisation = async (data: {
    org_name: string;
    org_status: "ACTIVE";
  }) => {
    setLoading(true);

    try {
      const response = await createOrg({
        org_name: data.org_name,
        org_status: "ACTIVE",
      });

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      toast.success("Organisation created successfully!");
      setSheetOpen(false);
      refreshTable(); // ✅ single refresh source
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // Table Setup
  // ------------------------------
  const table = useReactTable({
    data: orgs,
    columns: orgColumn(refreshTable), // ✅ correct contract
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ------------------------------
  // Render
  // ------------------------------
  return (
    <DataTable table={table}>
      <div className="px-3 pt-2">
        <h1 className="font-semibold text-xl">Manage Organisations</h1>
      </div>

      <DataTableToolbar
        table={table}
        excludeColumns={["actions"]}
        createButton={{
          label: "Create Organisation",
          onClick: () => setSheetOpen(true),
          visible: true,
        }}
      />

      <OrganisationCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Organisation"
        loading={loading}
        onSubmit={handleCreateOrganisation}
      />
    </DataTable>
  );
};

export default Organisations;
