import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraftExpiredDialogProps {
  open: boolean;
  onCreateNew: () => void;
  onDelete: () => void;
  onCancel: () => void;
}

const DraftExpiredDialog: React.FC<DraftExpiredDialogProps> = ({ open, onCreateNew, onDelete, onCancel }) => {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[400px]">
        <AlertDialogHeader className="items-center text-center">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-xl font-bold">Draft Expired</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-[14px] px-2">
            This draft has passed its 30-day validity period. You can no longer edit or submit this form, but you can still view the data for reference.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex flex-col gap-2 mt-4">
          <Button 
            onClick={onCreateNew} 
            className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-2 h-10 font-bold"
          >
            <Plus className="h-4 w-4" />
            Create New Form
          </Button>
          <Button 
            onClick={onDelete} 
            variant="outline" 
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-white flex items-center justify-center gap-2 h-10 font-bold"
          >
            <Trash2 className="h-4 w-4" />
            Delete Draft
          </Button>
          <Button 
            onClick={onCancel} 
            variant="ghost" 
            className="w-full text-muted-foreground hover:bg-muted font-bold h-10 mt-1"
          >
            Cancel (View Only)
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DraftExpiredDialog;
