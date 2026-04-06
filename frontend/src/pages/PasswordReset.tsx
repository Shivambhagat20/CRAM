import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resetPasswordWithToken } from "@/api/userApi";
import PasswordInput from "@/components/ui/PasswordInput";

export default function PasswordReset() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState(false);

    const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setServerError(null);

        if (newPassword.trim().length < 8 || newPassword !== confirmPassword) return;
        if (!token) {
            setServerError("Invalid or missing reset token.");
            return;
        }

        try {
            setLoading(true);

            await resetPasswordWithToken(token, newPassword);

            setSuccessMessage(true);
        } catch (err) {
            setServerError(err instanceof Error ? err.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    if (successMessage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-primary">
                <div className="flex flex-col gap-4 w-full max-w-sm p-6">
                    <h2 className="text-secondary text-2xl font-bold">Password Reset</h2>
                    <p className="text-foreground text-sm">
                        Your password was reset successfully. You can now log in.
                    </p>
                    <a
                        href="/"
                        className="text-sm text-foreground italic hover:text-secondary"
                    >
                        Back to home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary">
            <div className="flex flex-col gap-4 w-full max-w-sm p-6">
                <h2 className="text-secondary text-2xl font-bold">Reset Password</h2>
                <p className="text-foreground text-xs font-thin font-instrument">
                    Enter your new password below.
                </p>

                <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <div className="flex flex-col gap-0">
                        <PasswordInput placeholder="New password" password={newPassword} setPassword={setNewPassword} />

                        <p className={`font-instrument text-xs pl-1 italic ${newPassword.length > 0 && newPassword.length < 8 ? "text-destructive" : "text-secondary"}`}>
                            Password must be at least 8 characters
                        </p>
                    </div>

                    <div className="flex flex-col gap-0">
                        <PasswordInput placeholder="Confirm new password" password={confirmPassword} setPassword={setConfirmPassword} />
                        
                        <p className={`font-instrument text-xs pl-1 italic ${confirmPassword.length > 0 && confirmPassword !== newPassword ? "text-destructive" : "text-secondary"}`}>
                            Passwords must match
                        </p>
                    </div>

                    <Button
                        type="submit"
                        variant="outline"
                        disabled={loading}
                        className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </Button>

                    {serverError && (
                        <p className="text-destructive text-sm text-center mt-2">
                            {serverError}
                        </p>
                    )}
                </form>

                <a
                    href="/"
                    className="text-sm text-foreground italic hover:text-secondary"
                >
                    Back to home
                </a>
            </div>
        </div>
    );
}
