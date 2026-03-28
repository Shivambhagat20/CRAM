import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

type AuthMode = "login" | "signup";

interface AuthDialogProps {
  open: boolean;
  mode: AuthMode;
  setOpen: (open: boolean) => void;
  setMode: (mode: AuthMode) => void;
}

export default function AuthDialog({ open, mode, setOpen, setMode }: AuthDialogProps) {
    return (
        <Dialog 
            open={open} 
            onOpenChange={setOpen}
            confirmOnClose
        >
            <DialogContent className="bg-primary">
                {mode === "login" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-secondary text-2xl">
                                Login
                                <DialogDescription className="font-thin font-instrument text-foreground text-xs mt-2">
                                    Enter your username and password to log in.
                                </DialogDescription>
                            </DialogTitle>
                        </DialogHeader>

                        <LoginForm setOpen={setOpen} />
                        <button
                            onClick={() => setMode("signup")}
                            className="text-sm text-foreground italic hover:text-secondary hover:cursor-pointer"
                        >
                            Create an account
                        </button>
                    </>
                ):(
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-secondary text-2xl">
                                Create Account
                                <DialogDescription className="font-thin font-instrument text-foreground text-xs mt-2">
                                    Fill out the form below to create an account.
                                </DialogDescription>

                            </DialogTitle>
                        </DialogHeader>
                        <SignupForm />

                        <button
                            onClick={() => setMode("login")}
                            className="text-sm text-foreground italic hover:text-secondary hover:cursor-pointer"
                        >
                            Already have an account?
                        </button>
                    </>
                )}

            </DialogContent>
        </Dialog>
  );
}