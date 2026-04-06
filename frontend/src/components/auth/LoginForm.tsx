import { useState } from "react";
import { Button } from "../ui/button";
import { loginUser, sendPasswordResetLink } from "@/api/userApi";
import PasswordInput from "../ui/PasswordInput";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormProps {
    setOpen: (open: boolean) => void;
}

export default function LoginForm({ setOpen }: LoginFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const { setUser } = useAuth();
    const [forgotPassword, setForgotPassword] = useState(false);

    const onLogin = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setServerError(null); // remove old errors

        // try to login
        try {
            setLoading(true);

            const user = await loginUser({ 
                email: email.trim().toLowerCase(),
                password
            })

            // update globally known user
            setUser(user);
            setOpen(false);
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    const onForgotPassword = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setServerError(null); // remove old errors

        // try to send forgot password link
        try {
            setLoading(true);

            await sendPasswordResetLink(email);

            setSuccessMessage("If an account with that email exists, a password reset link has been sent.")
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        !forgotPassword ? (
            <form 
                className="flex flex-col gap-4"
                onSubmit={onLogin}
            >
                <div className="flex flex-col gap-0">
                    <input 
                        type="email" 
                        placeholder="Email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-funnel font-thin border-2 border-foreground rounded-sm p-1"
                        required
                    />
                </div>

                <div className="flex flex-col gap-0">
                    <PasswordInput placeholder="Password" password={password} setPassword={setPassword} />

                    <Button 
                        type="button"
                        className="justify-start font-bold text-foreground hover:text-secondary hover:cursor-pointer"
                        onClick={() => setForgotPassword(true)}
                    >
                        Forgot password?
                    </Button>
                </div>

                <Button 
                    type="submit"
                    variant="outline"
                    disabled={loading}
                    className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer"
                >
                    {loading ? "Logging in..." : "Login"}
                </Button>

                {serverError && (
                    <p className="text-destructive text-sm text-center mt-2">
                        {serverError}
                    </p>
                )}
            </form>
        ) : (
            <form className="flex flex-col" onSubmit={onForgotPassword}>
                <div className="flex flex-col sm:p-2 gap-4 w-full">
                    <div>
                        <input
                            type="email"
                            placeholder="Enter new email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="outline"
                        disabled={loading}
                        className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                        onClick={() => setForgotPassword(false)}
                    >
                        Back to Login
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
    )
};