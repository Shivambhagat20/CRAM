import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AVATAR_MAP } from "@/constants/avatars";

interface ProfilePicDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    onSelect: (src: string) => void;
}

export default function ProfilePicDialog({ open, setOpen, onSelect }: ProfilePicDialogProps) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-primary">
                <DialogHeader>
                    <DialogTitle className="text-secondary text-2xl">
                        Choose a Profile Picture
                        <DialogDescription className="font-thin font-instrument text-foreground text-xs mt-2">
                            Select one of the options below.
                        </DialogDescription>
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[60vh]">
                    {Object.keys(AVATAR_MAP).map((key) => (
                        <img
                            key={key}
                            src={AVATAR_MAP[key]}
                            className="rounded-full cursor-pointer hover:ring-2 hover:ring-secondary"
                            onClick={() => {
                                onSelect(key);
                                setOpen(false);
                            }}
                        />
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}