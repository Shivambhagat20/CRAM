import { updateUser } from "@/api/userApi";
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

interface ChangeUsernameFormProps {
    userId?: string;
    changeUsername: boolean;
    profileUser: ProfileUser;
    setProfileUser: (user: ProfileUser | null) => void;
}

// Form for changing the username
// Takes in the userId, boolean for display, and profile user details
export default function ChangeUsernameForm({ userId, changeUsername, profileUser, setProfileUser }: ChangeUsernameFormProps) {
    const { user, setUser } = useAuth();
    const [newUsername, setNewUsername] = useState("");
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // reset states when button is clicked
    useEffect(() => {
        setServerError(null);
        setSuccessMessage(null);
        setLoading(false);
        setNewUsername("");
    }, [changeUsername]);

    if (!userId) return;

    const onChangeUsername = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);
        setServerError(null); // remove old errors

        // return if field is empty
        if (!newUsername.trim()) return;

        // send the request to change the username
        try {
            setLoading(true);

            await updateUser(userId, { username: newUsername });

            // update the values on the page and in the session
            setProfileUser({ ...profileUser, username: newUsername });
            setUser({ ...user!, username: newUsername });

            setSuccessMessage("Your username was changed successfully!");
            setNewUsername("");
        } catch (err) {
            setServerError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col" onSubmit={onChangeUsername}>
            <div className="flex flex-col sm:p-2 gap-4 w-full">
                <div>
                    <input
                        type="text"
                        placeholder="Enter new username"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="font-funnel font-thin text-xs sm:text-sm bg-background text-foreground border border-foreground rounded-md p-2 w-full"
                        required
                    />
                    {/* Username cannot be empty */}
                    <p className={`text-xs font-funnel italic gap-0 ${
                        newUsername.length > 0 && newUsername.length === 0 ? "text-destructive" : "text-secondary"
                    }`}>
                        Name cannot be empty
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
    );
}