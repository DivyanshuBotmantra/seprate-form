import { useSearchParams } from "react-router-dom";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SystemFields = () => {
    const [searchParams] = useSearchParams();
    const transId = searchParams.get("transId");

    return (
        <>
            <CardHeader className="pb-4">
                <CardTitle className="text-base font-bold text-primary">System Metadata</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 items-start">
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
            </CardContent>
        </>
    );
};
export default SystemFields;
