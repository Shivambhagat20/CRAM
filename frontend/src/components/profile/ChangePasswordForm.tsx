import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { resetPassword } from "@/api/userApi";

interface ChangePasswordFormProps {
    userId?: string;
    changePassword: boolean;
}

export default function ChangePasswordForm({ userId, changePassword }: ChangePasswordFormProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // reset states when button is clicked
    useEffect(() => {
        setServerError(null);
        setSuccessMessage(null);
        setLoading(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    }, [changePassword]);
    
    if (!userId) return;

    const onChangePassword = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        // return if field validation fails
        if (newPassword.trim().length < 8 || newPassword !== confirmPassword) {
            return;
        }

        // send the request to change password
        try {
            setLoading(true);

            await resetPassword(userId, {currentPassword, newPassword, confirmPassword });

            setSuccessMessage("Your password was changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col" onSubmit={onChangePassword}>
            <div className="flex flex-col sm:p-2 gap-4 w-full">
                <input 
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                    required
                />
                <div>
                    <input 
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                        required
                    />
                    <p className={`text-xs font-funnel italic gap-0 ${newPassword.length > 0 && newPassword.length < 8 ? "text-destructive" : "text-secondary"}`}>
                        Password must be at least 8 characters
                    </p>
                </div>

                <div>
                    <input 
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                        required
                    />
                    <p className={`text-xs font-funnel italic gap-0 ${confirmPassword.length > 0 && confirmPassword !== newPassword ? "text-destructive" : "text-secondary"}`}>
                        Passwords must match
                    </p>
                </div>

                <Button 
                    type="submit"
                    variant="outline"
                    disabled={loading}
                    className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                >
                    {loading ? "Confirming..." : "Confirm"}
                </Button>

                {serverError && (
                    <p className="text-destructive text-sm text-center mt-2">
                        {serverError}
                    </p>
                )}

                {successMessage && (
                    <p className="text-green-600 text-sm text-center mt-2">
                        {successMessage}
                    </p>
                )}
            </div>
        </form>
    )
}