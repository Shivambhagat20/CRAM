import { changeEmail, confirmEmailChange } from "@/api/userApi";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface ProfileUser {
    id: string;
    username: string;
    email: string;
    role: string;
    isVerified?: boolean;
    profilePic?: string;
}

interface ChangeEmailFormProps {
    userId?: string;
    changeEmail: boolean;
    profileUser: ProfileUser;
    setProfileUser: (user: ProfileUser | null) => void;
}

// Form for changing the email
// Two stage: first enter new email and send verification code, then enter the code to confirm
export default function ChangeEmailForm({ userId, changeEmail: changeEmailOpen, profileUser, setProfileUser }: ChangeEmailFormProps) {
    const { user, setUser } = useAuth();
    const [newEmail, setNewEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // reset states when button is clicked
    useEffect(() => {
        setServerError(null);
        setSuccessMessage(null);
        setLoading(false);
        setNewEmail("");
        setVerificationCode("");
        setCodeSent(false);
    }, [changeEmailOpen]);

    if (!userId) return;

    const onRequestCode = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        // return if email change fails validation
        if (!newEmail.endsWith("@myumanitoba.ca") && !newEmail.endsWith("@umanitoba.ca")) {
            return; // helper text turns red when validation fails
        }

        // send the request to change the email and trigger verification code
        try {
            setLoading(true);

            await changeEmail(userId, newEmail);

            setCodeSent(true);
            setSuccessMessage("Verification code sent to your new email!");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    const onConfirmCode = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        // return if code is empty or not 6 digits long
        if (!verificationCode.trim() || verificationCode.length !== 6) return;

        // send the verification code to confirm the email change
        try {
            setLoading(true);

            await confirmEmailChange(userId, verificationCode);

            // update the values on the page and in the session
            setProfileUser({ ...profileUser, email: newEmail, isVerified: true });
            setUser({ ...user!, email: newEmail, isVerified: true });

            setSuccessMessage("Your email was changed successfully!");
            setNewEmail("");
            setVerificationCode("");
            setCodeSent(false);
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        // stage 1: enter new email
        !codeSent ? (
            <form className="flex flex-col" onSubmit={onRequestCode}>
                <div className="flex flex-col sm:p-2 gap-4 w-full">
                    <div>
                        <input
                            type="email"
                            placeholder="Enter new email"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                            required
                        />
                        {/* Email requires domain check */}
                        <p className={`text-xs font-funnel italic gap-0 ${
                            (newEmail.length > 0 && !newEmail.endsWith("@myumanitoba.ca") && !newEmail.endsWith("@umanitoba.ca")) ? "text-destructive" : "text-secondary"
                        }`}>
                            Email must end in "@myumanitoba.ca" or "@umanitoba.ca"
                        </p>
                    </div>

                    <Button
                        type="submit"
                        variant="outline"
                        disabled={loading}
                        className="font-bold text-foreground hover:text-secondary hover:bg-accent hover:cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Sending..." : "Send Verification Code"}
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
        ) : (
            // stage 2: enter verification code
            <form className="flex flex-col" onSubmit={onConfirmCode}>
                <div className="flex flex-col sm:p-2 gap-4 w-full">
                    <div>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            placeholder="Enter 6-digit verification code"
                            value={verificationCode} 
                            // onChange will replace all non-numbers with nothing
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                            className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                            required
                        />
                        {/* Code must not be empty */}
                        <p className="text-xs font-funnel italic text-secondary">
                            Enter the code sent to {newEmail}
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
    );
}