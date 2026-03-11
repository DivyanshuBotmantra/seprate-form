import { useState, useCallback } from "react";

import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import PageHeader from "@/components/common/header";

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
} from "@tanstack/react-table";

import { toast } from "sonner";

import formMaster from "@/services/form-master";
import { useOrgData } from "@/hooks/useOrgData";
import { isSuperAdmin } from "@/lib/auth";

import FormMasterColumn from "@/components/form-master/column-form-master";
import { FormMasterCreateSheet } from "@/components/form-master/sheet/create-form-master-sheet";

type FormMasterItem = {
  org_name: string;
  form_code: string;
  form_name: string;
  form_category: string;
  bot_trigger?: boolean;
  bot_code?: string;
  sidebar_visibility?: boolean;
  form_json?: any;
  form_status: string;
  email_flag?: boolean;
  email_name?: string;
};

const FormMasterPage = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormMasterItem[]>([]);

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";

  // --------------------------------------------------
  // Fetch form master list
  // --------------------------------------------------
  const fetchFormMaster = useCallback(async (orgName: string) => {
    if (!orgName) return;

    try {
      const payload = {
        org_name: orgName,
        form_code: "",
        form_category: "",
      };

      const res = await formMaster.getformaster(payload);

      setFormData(res?.data?.response_body || []);
      if (res?.error) console.error(res.error);
    } catch (err) {
      console.error("Form master fetch error:", err);
      toast.error("Failed to fetch forms");
      setFormData([]);
    }
  }, []);

  useOrgData(fetchFormMaster);

  // --------------------------------------------------
  // Global search filter
  // --------------------------------------------------
  const globalFilterFn = (row: any, _columnId: string, filterValue: string) => {
    const search = String(filterValue).toLowerCase();
    const { form_name, form_category, form_status } = row.original;

    return (
      form_name?.toLowerCase().includes(search) ||
      form_category?.toLowerCase().includes(search) ||
      form_status?.toLowerCase().includes(search)
    );
  };

  const refreshTable = () => fetchFormMaster(orgName);

  const isSuper = isSuperAdmin();
  const table = useReactTable({
    data: formData,
    columns: FormMasterColumn(refreshTable, isSuper),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    state: {
      sorting,
      globalFilter,
    },

    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
  });

  return (
    <>
      <DataTable table={table}>
        <PageHeader title="Form Master" />

        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Create Form",
            onClick: () => setSheetOpen(true),
            visible: isSuperAdmin(),
          }}
        />
      </DataTable>

      <FormMasterCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Form Master"
        loading={loading}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default FormMasterPage;
