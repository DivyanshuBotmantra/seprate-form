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
import { useState } from "react";

interface TaskPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "reject" | "validate";
  onConfirm: () => Promise<void>;
}

const TaskPreviewDialog = ({
  open,
  onOpenChange,
  type,
  onConfirm,
}: TaskPreviewDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const dialogContent = {
    reject: {
      title: "Reject Task",
      description:
        "Are you sure you want to reject this task? This action cannot be undone. In case you made any changes to the task, they will be lost.",
      confirmText: "Reject",
      cancelText: "Cancel",
      variant: "destructive" as const,
    },
    validate: {
      title: "Validate Task",
      description:
        "Are you sure you want to validate this task? Please ensure all information is correct before proceeding.",
      confirmText: "Validate",
      cancelText: "Cancel",
      variant: "default" as const,
    },
  };

  const content = dialogContent[type];

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{content.title}</AlertDialogTitle>
          <AlertDialogDescription>{content.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {content.cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isLoading}
            className={
              content.variant === "destructive"
                ? "bg-danger border-danger  hover:bg-destructive/90"
                : ""
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              content.confirmText
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TaskPreviewDialog;
