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

const SystemSampling = () => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [tbRecon, setTbRecon] = useState<any[]>([]);
    const navigate = useNavigate();
    const fetchBotExecutionLog = async () => {
        try {
            const payload = {
                org_name: "CLA-AUDIT",
                bot_name: "System Sampling",
                bot_category: "Revenue",
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

    useEffect(() => {
        fetchBotExecutionLog();
    }, []);

    const table = useReactTable({
        data: tbRecon,
        columns: TbReconColumn("System Sampling"),
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
                <h1 className="font-semibold text-xl">System Sampling</h1>
            </div>
            <DataTableToolbar
                table={table}
                excludeColumns={["actions"]}
                createButton={{
                    label: "Start Execution",
                    onClick: () => {
                        navigate("/trigger-3rd-page");
                    },
                    visible: true,
                }}
            />
        </DataTable>
    );
};

export default SystemSampling;
