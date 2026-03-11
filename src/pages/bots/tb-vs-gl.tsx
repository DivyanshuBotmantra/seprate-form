import TbReconColumn from "@/components/bots/tb-vs-gl/tb-recon-column";
import { DataTable } from "@/components/common/table/data-table";
import { DataTableToolbar } from "@/components/common/table/data-table-toolbar";
import { useOrgStore } from "@/lib/store/org-store";
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import botConfigApi from "@/services/botConfig";

const TbVsGlReconciliation = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [tbRecon, setTbRecon] = useState<any[]>([]);
  const selectedOrg = useOrgStore((s) => s.selectedOrg?.org_name);
  const [botConfig, setBotConfig] = useState<any[]>([]);
  const [showStartExecutionButton, setShowStartExecutionButton] =
    useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bot_code = searchParams.get("bot_code");
  const fetchBotExecutionLog = async () => {
    try {
      const payload = {
        org_name: selectedOrg,
        bot_name: "TB vs GL Reconciliation",
        bot_category: "TB vs GL",
        bot_code: bot_code,
      };

      const res = await botExecutionService.getBotExecutionLog(payload);

      if (res?.data?.response_body) {
        setTbRecon(res.data.response_body);
      } else {
        setTbRecon([]);
      }

      if (res.error) {
        toast.error(res.error);
      }
    } catch (err) {
      toast.error("Failed to fetch TB vs GL Reconciliation");
      console.error(err);
      setTbRecon([]);
    }
  };

  const fetchBotConfig = async () => {
    const payload = {
      org_name: selectedOrg,
      bot_name: "TB vs GL Reconciliation",
      bot_category: "TB vs GL",
      bot_code: bot_code,
    };
    const res = await botConfigApi.getBotConfig(payload);
    if (res?.data?.response_body) {
      const botTriggerFormJson =
        res.data.response_body[0].bot_trigger_form_json;
      setBotConfig(botTriggerFormJson);
      if (botTriggerFormJson && botTriggerFormJson.url) {
        setShowStartExecutionButton(true);
      } else {
        setShowStartExecutionButton(false);
      }
    } else {
      setBotConfig([]);
      setShowStartExecutionButton(false);
    }
  };

  useEffect(() => {
    if (bot_code) {
      fetchBotExecutionLog();
      fetchBotConfig();
    }
  }, [selectedOrg, bot_code]);

  useEffect(() => {
    console.log(botConfig, "botConfig");
  }, [botConfig]);

  const table = useReactTable({
    data: tbRecon,
    columns: TbReconColumn("TB vs GL Reconciliation"),
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
        <h1 className="font-semibold text-xl">TB vs GL Reconciliation</h1>
      </div>
      <DataTableToolbar
        table={table}
        excludeColumns={["actions"]}
        createButton={{
          label: "Start Execution",
          onClick: () => {
            navigate("/trigger-page");
          },
          visible: showStartExecutionButton,
        }}
      />
    </DataTable>
  );
};

export default TbVsGlReconciliation;
