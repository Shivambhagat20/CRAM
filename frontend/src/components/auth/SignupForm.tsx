import { useState } from "react";
import { Button } from "../ui/button";

import { validateSignup } from "@/utils/validators";
import { createUser, verifyEmail } from "@/api/userApi";
import PasswordInput from "../ui/PasswordInput";

export default function SignupForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // controls which stage of signup is shown
    const [codeSent, setCodeSent] = useState(false);
    const [verificationCode, setVerificationCode] = useState("");

    const onSignup = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors
        
        // return if any validation fails
        const validationResults = validateSignup({ name, email, password, confirmPassword });
        if (Object.keys(validationResults).length > 0) return;

        // valid signup, package details and send to backend
        try {
            setLoading(true);

            await createUser({ 
                name: name.trim(),
                email: email.trim().toLowerCase(), 
                password 
            });

            // move to verification stage
            setCodeSent(true);
            setSuccessMessage("Verification code sent to your email!");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    const onVerify = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        // return if code is empty or not 6 digits
        if (!verificationCode.trim() || verificationCode.length !== 6) return;

        // try to verify the code
        try {
            setLoading(true);

            await verifyEmail({email: email.trim().toLowerCase(), code: verificationCode});

            setSuccessMessage("Account successfully verified! You can now log in.");
            setVerificationCode("");
            setCodeSent(false);
            setName("");
            setEmail("");
            setPassword("");
            setConfirmPassword("");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    // stage 1: signup form
    if (!codeSent) {
        return (
            <form className="flex flex-col gap-4" onSubmit={onSignup}>
                <div className="flex flex-col gap-0">
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="font-funnel font-thin border-2 border-foreground rounded-sm p-1"
                        required
                    />
                    <p className={`font-instrument text-xs pl-1 italic ${name.length > 0 && name.length === 0 ? "text-destructive" : "text-secondary"}`}>
                        Name must not be empty
                    </p>
                </div>

                <div className="flex flex-col gap-0">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-funnel font-thin border-2 border-foreground rounded-sm p-1"
                        required
                    />
                    <p className={`font-instrument text-xs pl-1 italic ${
                            (email.length > 0 && !email.endsWith("@myumanitoba.ca") && !email.endsWith("@umanitoba.ca")) ? "text-destructive" : "text-secondary"
                    }`}>
                        Email must end in "@myumanitoba.ca" or "@umanitoba.ca"
                    </p>
                </div>

                <div className="flex flex-col gap-0">
                    <PasswordInput placeholder="Password" password={password} setPassword={setPassword} />

                    <p className={`font-instrument text-xs pl-1 italic ${password.length > 0 && password.length < 8 ? "text-destructive" : "text-secondary"}`}>
                        Password must be at least 8 characters
                    </p>
                </div>

                <div className="flex flex-col gap-0">
                    <PasswordInput placeholder="Confirm Password" password={confirmPassword} setPassword={setConfirmPassword} />

                    <p className={`font-instrument text-xs pl-1 italic ${confirmPassword.length > 0 && confirmPassword !== password ? "text-destructive" : "text-secondary"}`}>
                        Passwords must match
                    </p>
                </div>

                <Button
                    type="submit"
                    variant="outline"
                    disabled={loading}
                    className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                >
                    {loading ? "Creating Account..." : "Create Account"}
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
            </form>
        );
    }

    // stage 2: verification code form
    return (
        <form className="flex flex-col gap-4" onSubmit={onVerify}>
            <div className="flex flex-col gap-0">
                <input
                    type="text"
                    placeholder="Enter 6-digit verification code"
                    value={verificationCode}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="font-funnel font-thin border-2 border-foreground rounded-sm p-1"
                    required
                />
                {/* Show which email the code was sent to */}
                <p className="font-instrument text-xs pl-1 italic text-secondary">
                    Enter the code sent to {email}
                </p>
            </div>

            <Button
                type="submit"
                variant="outline"
                disabled={loading}
                className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
            >
                {loading ? "Verifying..." : "Verify Account"}
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
        </form>
    );
}
