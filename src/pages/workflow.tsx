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
import workflow from "@/services/workflow";

import { useOrgData } from "@/hooks/useOrgData";
import { isSuperAdmin } from "@/lib/auth";

import WorkFlowColumn from "@/components/work-flow/workflow-column";
import { WorkflowCreateSheet } from "@/components/work-flow/sheet/create-workflow-sheet";

// ---------------------- Types ----------------------
type WorkflowItem = {
  org_name: string;
  wf_name: string;
  wf_code: string;
  wf_category: string;
  wf_trigger_form_json?: any;
  wf_status: string;
};

const WorkFlow = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [workflowData, setWorkflowData] = useState<WorkflowItem[]>([]);

  // ---------------- FETCH WORKFLOW DATA ----------------
  const fetchWorkflow = useCallback(async (orgName: string) => {
    if (!orgName) return;

    try {
      const payload = {
        org_name: orgName,
        wf_code: "",
        wf_name: "",
        wf_category: "",
        wf_status: "",
      };

      const res = await workflow.getWorkFlow(payload);

      setWorkflowData(res?.data?.response_body || []);

      if (res.error) console.error(res.error);
    } catch (err) {
      toast.error("Failed to fetch workflow");
      setWorkflowData([]);
      console.error("Error fetching workflow:", err);
    }
  }, []);

  // Automatically fetch when org changes
  useOrgData(fetchWorkflow);

  // ---------------- GLOBAL SEARCH ----------------
  const globalFilterFn = (row, _columnId, filterValue) => {
    const search = String(filterValue).toLowerCase();
    const { wf_name, wf_category, wf_status } = row.original;

    return (
      wf_name?.toLowerCase().includes(search) ||
      wf_category?.toLowerCase().includes(search) ||
      wf_status?.toLowerCase().includes(search)
    );
  };

  // ---------------- REFRESH TABLE ----------------
  const refreshTable = () => {
    const orgName = JSON.parse(
      sessionStorage.getItem("SelectedOrg") || "{}"
    )?.org_name;

    fetchWorkflow(orgName);
  };

  // ---------------- TABLE SETUP ----------------
  const table = useReactTable({
    data: workflowData,
    columns: WorkFlowColumn(refreshTable),
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
    enableRowPinning: true,
  });

  return (
    <>
      <DataTable table={table}>
        <PageHeader title="Workflow" />

        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Create Workflow",
            onClick: () => setSheetOpen(true),
            visible: isSuperAdmin(),
          }}
        />
      </DataTable>
      <WorkflowCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Workflow"
        loading={loading}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default WorkFlow;
