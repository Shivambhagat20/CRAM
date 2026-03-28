import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import DefinitionForm from "./DefinitionForm";
import type { Definition } from "@/api/sectionsApi";

type DefinitionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: Definition;
  courseCode: string;
  onSuccess: (def: Definition) => void;
};

export default function DefinitionDialog({
  open,
  onOpenChange,
  mode,
  initialValues,
  courseCode,
  onSuccess
}: DefinitionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} confirmOnClose>
      <DialogContent className="sm:max-w-[40vw] max-w-[40vw]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Add New Definition"
              : "Edit Definition"}
          </DialogTitle>

          <DialogDescription>
            {mode === "create"
              ? "Add a new term to this course."
              : "Update this definition."}
          </DialogDescription>
        </DialogHeader>

        <DefinitionForm
          mode={mode}
          initialValues={initialValues}
          courseCode ={courseCode}
          onSuccess={(def) => {
            onOpenChange(false);
            onSuccess?.(def)
          }}
        />
      </DialogContent>
    </Dialog>
  );
}