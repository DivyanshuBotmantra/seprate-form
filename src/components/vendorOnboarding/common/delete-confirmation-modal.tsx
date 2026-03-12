import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    itemName?: string;
    loading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    itemName,
    loading = false,
}) => (
    <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[440px] border-destructive/20">
            <DialogHeader className="space-y-4 text-left">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-lg ring-2 ring-destructive/20 transition-all duration-300">
                    <AlertTriangle className="h-7 w-7" strokeWidth={2.5} aria-hidden />
                </div>
                <div className="space-y-2">
                    <DialogTitle className="text-xl font-semibold text-foreground">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="text-[15px] leading-relaxed text-muted-foreground">
                        {description}
                    </DialogDescription>
                </div>
            </DialogHeader>

            {itemName && (
                <div className="group relative overflow-hidden rounded-lg border-2 border-destructive/30 bg-destructive/5 px-4 py-3.5 transition-all duration-200 hover:border-destructive/40 hover:bg-destructive/8">
                    <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 to-transparent opacity-50" />
                    <span className="relative font-mono text-[13px] font-medium text-foreground/90 break-all leading-relaxed">
                        {itemName}
                    </span>
                </div>
            )}

            <DialogFooter className="flex-col gap-2.5 border-t border-border/50 pt-5 sm:flex-row sm:justify-end sm:gap-3">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="w-full border-border/60 hover:bg-muted/50 sm:w-auto transition-all duration-200"
                >
                    Cancel
                </Button>
                <Button
                    variant="destructive"
                    onClick={onConfirm}
                    disabled={loading}
                    className="w-full min-w-[120px] shadow-md hover:shadow-lg transition-all duration-200 sm:w-auto"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive-foreground/30 border-t-destructive-foreground" />
                            <span>Deleting...</span>
                        </div>
                    ) : (
                        'Delete'
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);
