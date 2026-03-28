import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
};

export function ConfirmDialog({ open, onConfirm, onCancel, message }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
        <DialogContent className="max-w-sm bg-primary p-6 rounded-xl shadow-lg border-0">
            <DialogHeader>
                <DialogTitle className="text-secondary">
                    Are you sure?
                </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-foreground mt-2">
                {message ?? "You have unsaved changes. Closing will discard them."}
            </p>
            <DialogFooter className="mt-4 flex gap-2 justify-end">
                <Button 
                    variant="secondary" 
                    className="hover:cursor-pointer" 
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button 
                    variant="destructive" 
                    className="hover:cursor-pointer"  
                    onClick={onConfirm}
                >
                    Yes, close
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}