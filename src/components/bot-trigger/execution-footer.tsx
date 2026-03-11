import { Button } from "@/components/ui/button";

interface ExecutionFooterProps {
    isUploading: boolean;
    isSubmitting: boolean;
    uploadedFilesCount: number;
    handleRemoveAllFiles: () => void;
}

export function ExecutionFooter({
    isUploading,
    isSubmitting,
    uploadedFilesCount,
    handleRemoveAllFiles,
}: ExecutionFooterProps) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                <div className="w-2 h-2 bg-btn-primary/60 rounded-full animate-pulse"></div>
                {isUploading ? "Waiting for uploads to complete..." : "Ensure columns match the standard templates"}
            </div>
            <div className="flex gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveAllFiles}
                    disabled={isSubmitting || isUploading || uploadedFilesCount === 0}
                    className="h-9 px-5 text-sm font-semibold rounded-lg hover:bg-muted border-border/50 transition-all"
                >
                    Reset
                </Button>
                <Button
                    id="static-submit-btn"
                    type="submit"
                    disabled={isSubmitting || isUploading || uploadedFilesCount === 0}
                    className="h-9 px-8 bg-btn-primary hover:bg-btn-primary/90 text-white text-sm font-bold rounded-lg shadow-lg shadow-btn-primary/25 hover:shadow-btn-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
                >
                    {isSubmitting ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Running...
                        </span>
                    ) : (
                        `Run Execution${uploadedFilesCount > 0 ? ` (${uploadedFilesCount})` : ''}`
                    )}
                </Button>
            </div>
        </div>
    );
}
