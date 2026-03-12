const SystemFields = () => {
    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4 text-primary">System Generated Fields</h3>
            <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg border border-dashed">
                <div className="text-muted-foreground">Form ID:</div>
                <div className="font-mono text-xs">Auto-generated on save</div>
                <div className="text-muted-foreground">Submitted On:</div>
                <div>-</div>
                <div className="text-muted-foreground">Version:</div>
                <div>1.0 (RHF Optimized)</div>
            </div>
        </div>
    );
};
export default SystemFields;
