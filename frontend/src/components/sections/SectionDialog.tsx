import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import Rte from "../editor/Rte";
import type { Section } from "@/api/sectionsApi";

type SectionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  courseCode: string;
  initialValues?: Section; 
  onSave?: (section: Section) => void;
};

export default function SectionDialog({
  open,
  onOpenChange,
  onSave,
  mode,
  courseCode,
  initialValues,
}: SectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} confirmOnClose>
      <DialogContent className="sm:max-w-[70vw] max-w-[70vw]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create a New Section" : "Edit Section"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "When done, this section will be added to the course!"
              : "Update the content of this section."}
          </DialogDescription>
        </DialogHeader>

        <Rte
          mode={mode}
          sectionId={initialValues?._id}
          onSuccess={(section) => {
            onSave?.(section);
            onOpenChange(false);
          }}
          initialValues={initialValues}
          courseCode={courseCode}
        />
      </DialogContent>
    </Dialog>
  );
}