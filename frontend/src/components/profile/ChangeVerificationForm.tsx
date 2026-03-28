import { requestVerificationCode, verifyEmail } from "@/api/userApi";
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

interface ChangeVerificationFormProps {
    userId?: string;
    changeVerification: boolean;
    profileUser: ProfileUser;
    setProfileUser: (user: ProfileUser | null) => void;
    setChangeVerification: React.Dispatch<React.SetStateAction<boolean>>
}

// Form for verifying the account
// Two stage: first request verification code, then enter the 6-digit code to confirm
export default function ChangeVerificationForm({
    userId,
    changeVerification: changeVerificationOpen,
    profileUser,
    setProfileUser,
    setChangeVerification,
}: ChangeVerificationFormProps) {
    const { user, setUser } = useAuth();
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
        setVerificationCode("");
        setCodeSent(false);
    }, [changeVerificationOpen]);

    if (!userId) return;

    const onRequestCode = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        try {
            setLoading(true);

            await requestVerificationCode(userId);

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

    const onConfirmCode = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null);

        // return if code is empty or not 6 digits long
        if (!verificationCode.trim() || verificationCode.length !== 6) return;

        try {
            setLoading(true);

            await verifyEmail({ email: profileUser.email, code: verificationCode });

            // update the values on the page and in the session
            setProfileUser({ ...profileUser, isVerified: true });
            setUser({ ...user!, isVerified: true });

            setSuccessMessage("Your account was verified successfully!");
            setVerificationCode("");
            setCodeSent(false);
            setChangeVerification(false);
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        !codeSent ? (
            <form className="flex flex-col" onSubmit={onRequestCode}>
                <div className="flex flex-col sm:p-2 gap-4 w-full">
                    <div>
                        <p className="text-xs font-funnel italic text-secondary">
                            Send a verification code to {profileUser.email}
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
                            onChange={(e) =>
                                setVerificationCode(e.target.value.replace(/\D/g, ""))
                            }
                            className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                            required
                        />
                        <p className="text-xs font-funnel italic text-secondary">
                            Enter the code sent to {profileUser.email}
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