import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    formName: string;
    filesCount: number;
}

export function ConfirmationDialog({
    isOpen,
    onOpenChange,
    onConfirm,
    formName,
    filesCount,
}: ConfirmationDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
            <AlertDialogContent
                className="max-w-md bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300"
                onOpenAutoFocus={(e) => {
                    e.preventDefault();
                    document.getElementById("static-confirm-btn")?.focus();
                }}
            >
                <AlertDialogHeader className="space-y-3">
                    <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                        Confirm Execution
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground font-medium">
                        You are about to initiate <span className="text-foreground font-bold">{formName}</span> execution for{" "}
                        <span className="text-btn-primary font-extrabold text-base">{filesCount}</span> file(s).
                        <br /><br />
                        Each file will trigger an independent bot execution session.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-3 mt-8">
                    <AlertDialogCancel className="h-11 px-6 rounded-xl font-bold border-border/50 hover:bg-muted transition-all">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        id="static-confirm-btn"
                        onClick={onConfirm}
                        className="h-11 px-10 bg-btn-primary hover:bg-btn-primary/90 text-white rounded-xl font-bold shadow-lg shadow-btn-primary/25 hover:shadow-btn-primary/40 transition-all active:scale-95"
                    >
                        Proceed Execution
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
