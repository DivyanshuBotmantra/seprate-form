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

import taskConfig from "@/services/task-config";
import { useOrgData } from "@/hooks/useOrgData";
import { isSuperAdmin } from "@/lib/auth";
import { TaskMasterCreateSheet } from "@/components/task-master/sheet/create-task-master-sheet";
import TaskMasterColumn from "@/components/task-master/task-master-column";

type TaskMasterItem = {
  org_name: string;
  task_code: string;
  task_name: string;
  task_category: string;
  task_url: string;
  task_form_json?: any;
  file_folder_path: string;
  file_credential?: any;
  storage_encryption: boolean;
  task_status: string;
};

const TaskConfig = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [taskData, setTaskData] = useState<TaskMasterItem[]>([]);

  const orgName =
    JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}")?.org_name || "";
  const fetchTaskMaster = useCallback(async (orgName: string) => {
    if (!orgName) return;
    try {
      const payload = {
        org_name: orgName,
        task_code: "", // future filters
        task_category: "",
      };
      const res = await taskConfig.getTaskmaster(payload);
      setTaskData(res?.data?.response_body || []);
      if (res?.error) {
        console.error(res.error);
      }
    } catch (err) {
      console.error("Task master fetch error:", err);

      setTaskData([]);
    }
  }, []);

  useOrgData(fetchTaskMaster);

  /**
   * Global search filter
   */
  const globalFilterFn = (row: any, _columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase();
    const { task_name, task_category, task_status } = row.original;

    return (
      task_name?.toLowerCase().includes(search) ||
      task_category?.toLowerCase().includes(search) ||
      task_status?.toLowerCase().includes(search)
    );
  };

  const refreshTable = () => fetchTaskMaster(orgName);

  const isSuper = isSuperAdmin();

  const table = useReactTable({
    data: taskData,
    columns: TaskMasterColumn(refreshTable, isSuper),
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
        <PageHeader title="Task Master" />

        <DataTableToolbar
          table={table}
          excludeColumns={["actions"]}
          createButton={{
            label: "Create Task",
            onClick: () => setSheetOpen(true),
            visible: isSuperAdmin(),
          }}
        />
      </DataTable>

      <TaskMasterCreateSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Create Task"
        loading={loading}
        refreshTable={refreshTable}
      />
    </>
  );
};

export default TaskConfig;
