import TbReconColumn from "@/components/bots/tb-vs-gl/tb-recon-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import botExecutionService from "@/services/bot/bot-execution";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const JudgementalSamplePreparation = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [judgementalSamplePreparation, setJudgementalSamplePreparation] =
    useState<any[]>([]);
  const navigate = useNavigate();
  const fetchBotExecutionLog = async () => {
    try {
      const payload = {
        org_name: "CLA-AUDIT",
        bot_name: "Judgemental Sample Preparation",
        bot_category: "Revenue",
      };

      const res = await botExecutionService.getBotExecutionLog(payload);

      if (res?.data?.response_body) {
        setJudgementalSamplePreparation(res.data.response_body);
      } else {
        setJudgementalSamplePreparation([]);
      }

      if (res.error) {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to fetch TB vs GL Reconciliation");
      console.error(err);
      setJudgementalSamplePreparation([]);
    }
  };

  useEffect(() => {
    fetchBotExecutionLog();
  }, []);

  const table = useReactTable({
    data: judgementalSamplePreparation,
    columns: TbReconColumn("Judgemental Sample Preparation"),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    enableRowPinning: true,
  });

  return (
    <DataTable table={table}>
      <div className="px-3 pt-2">
        <h1 className="font-semibold text-xl">
          Judgemental Sample Preparation
        </h1>
      </div>
      <DataTableToolbar
        table={table}
        excludeColumns={["actions"]}
        createButton={{
          label: "Start Execution",
          onClick: () => {
            navigate("/trigger-page-judgmental-sample-preparation");
          },
          visible: true,
        }}
      />
    </DataTable>
  );
};

export default JudgementalSamplePreparation;
