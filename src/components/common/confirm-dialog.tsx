import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import OrbitLoader from "../loader";

type ConfirmDeleteDialogProps = {
    /** unique id for the item being deleted */
    id: string;

    /** which dialog is currently open */
    openId: string | null;
    setOpenId: (id: string | null) => void;

    /** loading state */
    loading?: boolean;

    /** dialog text */
    title: string;
    description: React.ReactNode;

    /** confirm handler */
    onConfirm: (id: string) => Promise<void>;
};

const ConfirmDeleteDialog = ({
    id,
    openId,
    setOpenId,
    loading = false,
    title,
    description,
    onConfirm,
}: ConfirmDeleteDialogProps) => {
    const isOpen = openId === id;

    return (
        <AlertDialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) setOpenId(null);
            }}
        >
            <AlertDialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpenId(id)}
                    disabled={loading}
                >
                    <X />
                </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setOpenId(null)}>
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={async () => {
                            await onConfirm(id);
                            setOpenId(null);
                        }}
                    >
                        {loading ? <OrbitLoader /> : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmDeleteDialog;
