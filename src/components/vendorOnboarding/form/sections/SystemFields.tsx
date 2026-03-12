import { useSearchParams } from "react-router-dom";

const SystemFields = () => {
    const [searchParams] = useSearchParams();
    const transId = searchParams.get("transId");

    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-primary">System Metadata</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl border border-dashed bg-muted/10">
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transaction ID</p>
                    <p className="font-mono text-sm">{transId || "New Transaction (Unsaved)"}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Form Status</p>
                    <p className="text-sm font-medium">{transId ? "Draft / In Progress" : "Initiating..."}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Version Control</p>
                    <p className="text-sm">v2.0 (Refactored RHF)</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Last Action</p>
                    <p className="text-sm text-muted-foreground">Ready for submission</p>
                </div>
            </div>
        </div>
    );
};
export default SystemFields;
