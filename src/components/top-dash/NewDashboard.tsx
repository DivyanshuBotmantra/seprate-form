import { AuditTable } from "./audtilab";
import { StatusLegend } from "./statuss-legend";
import { TbVsGlCard } from "./tbvsgl";

const NewDashboard = () => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex gap-4">
                <div className="flex flex-col items-stretch bg-[#f0f0f0] rounded-xl  h-full flex-1">
                    <TbVsGlCard />
                    {/* <ProcessMetrics /> */}
                </div>
                <div className="bg-[#f0f0f0] rounded-xl flex-1 p-6">
                    <StatusLegend />
                </div>
            </div>
            <div className="bg-[#f0f0f0] rounded-xl p-2 ">
                <AuditTable />
            </div>
        </div>
    );
};

export default NewDashboard;
