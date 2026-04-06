import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent,ChartLegend, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useState, useEffect, useMemo } from "react";
import ProfilePicDialog from "@/components/profile/ProfilePicDialog";
import { useAuth } from "@/hooks/useAuth";
import { Link, useParams } from "react-router-dom";
import { AVATAR_MAP } from "@/constants/avatars";
import { getUserById, updateUser } from "@/api/userApi";
import ChangeVerificationForm from "@/components/profile/ChangeVerificationForm";
import ChangeUsernameForm from "@/components/profile/ChangeUsernameForm";
import ChangeEmailForm from "@/components/profile/ChangeEmailForm";
import ChangePasswordForm from "@/components/profile/ChangePasswordForm";

interface Contribution{
    refId: string;
    type: "section" | "definition";
    courseCode: string;
    date: string;
}

interface ProfileUser {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePic?: string;
    contributions?: Contribution[];
    isVerified?: boolean;
}

export default function Profile() {
    const { userId } = useParams();
    const { user, setUser } = useAuth(); // current logged-in user
    const [profileUser, setProfileUser] = useState<ProfileUser | null>(null); // details of the profile user
    const [picDialogOpen, setPicDialogOpen] = useState(false);
    const [selectedPic, setSelectedPic] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);
    const [changeVerification, setChangeVerification] = useState(false);
    const [changeUsername, setChangeUsername] = useState(false);
    const [changeEmail, setChangeEmail] = useState(false);
    const [changePassword, setChangePassword] = useState(false);

    // render profile change components if the profile belongs to the user
    const isOwnProfile = user?.id === userId;

    // modes supported by chart
    const [chartMode, setChartMode] = useState<"month" | "year" | "all">("month");

    // update the profile user details based on the id of the page
    useEffect(() => {
        if (!userId) return;

        const update = async () => {
            try {
                // reset states and then update profile user
                setServerError(null);
                setChangeUsername(false);
                setChangeVerification(false);
                setChangeEmail(false);
                setChangePassword(false);
                const profileUserDetails = await getUserById(userId);
                setProfileUser(profileUserDetails);
            } catch (err) {
                setServerError(
                    err instanceof Error ? err.message : "Something went wrong."
                );
            }
        };

        update();
    }, [userId, isOwnProfile]);

    // run the update user api request upon profile pic change
    useEffect(() => {
        if (!user || !selectedPic) return;
        
        const update = async () => {
            try {
                setServerError(null);
                await updateUser(user.id, { profilePic: selectedPic });
                setUser({ ...user, profilePic: selectedPic }); // immediate refresh
            } catch (err) {
                setServerError(
                    err instanceof Error ? err.message : "Something went wrong."
                );
            }
        };

        update();
    }, [selectedPic]);

    // set avatar key to be the user if they're on their own page
    // otherwise, to the key for that profile
    const avatarKey = isOwnProfile ? user?.profilePic ?? "" : profileUser?.profilePic ?? "";

    // Chart data
    const chartData = useMemo(() => {
        if (!profileUser?.contributions) return [];
        const now = new Date();

        // Helper: formats date keys depending on chartMode
        const formatKey = (date: Date) => {
            if (chartMode === "month") return `${date.getDate()}`;
            if (chartMode === "year") return new Date(0, date.getMonth()).toLocaleString("default", { month: "short" });
            return date.getFullYear().toString();
        };

        const dataMap: Record<string, { sections: number; definitions: number }> = {};

        profileUser.contributions.forEach((contribution) => {
            const date = new Date(contribution.date);

            // filter contributions depending on mode
            if (chartMode === "month" && (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear())) return;
            if (chartMode === "year" && date.getFullYear() !== now.getFullYear()) return;

            const key = formatKey(date);

            if (!dataMap[key]) dataMap[key] = { sections: 0, definitions: 0 };

            if (contribution.type === "section") dataMap[key].sections += 1;
            else if (contribution.type === "definition") dataMap[key].definitions += 1;
        });

        // Convert map to array for chart, sorted
        const sortedKeys = Object.keys(dataMap).sort((a, b) => {
            if (chartMode === "month") return Number(a) - Number(b);
            if (chartMode === "year") return new Date(`1 ${a} 2000`).getMonth() - new Date(`1 ${b} 2000`).getMonth();
            return Number(a) - Number(b);
        });

        return sortedKeys.map((key) => ({
            label: key,
            sections: dataMap[key].sections,
            definitions: dataMap[key].definitions,
        }));
    }, [profileUser, chartMode]);

    // Configures the chart labels and color
    const chartConfig = {
        contributions: {
            label: "Contributions",
            color: "#2563eb",
        },
    } satisfies ChartConfig;

    // Get 5 most recent contributions
    const recentContributions = useMemo(() => {
        if (!profileUser?.contributions) return [];

        return [...profileUser.contributions]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
    }, [profileUser]);

    return(
        <div className="flex flex-col md:flex-row my-5 gap-3 justify-center w-full">
            {/* Profile management section */}
            <div className="flex flex-col gap-2 p-3 self-center bg-primary rounded-md md:p-4 w-3/4 sm:w-2/4 md:w-2/5 xl:w-1/4 md:self-start">
                <h1 className="font-instrument text-base sm:text-lg font-bold">
                    Profile Details
                </h1>
                <Separator orientation="horizontal" className="my-0.5 bg-secondary" />

                {/* Profile picture */}
                <div className="flex flex-row items-center justify-between sm:p-2 sm:gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">
                        Avatar:
                    </p>
                    {/* Render the stored avatar or default pic */}
                    <div className="relative group" onClick={isOwnProfile ? () => setPicDialogOpen(true) : undefined}>
                        <Avatar size="lg">
                            <AvatarImage src={AVATAR_MAP[avatarKey ?? ""] ?? "https://github.com/shadcn.png"} />
                            <AvatarFallback>{profileUser?.username ?? "-"}</AvatarFallback> 
                        </Avatar>

                        {/* Dark overlay */}
                        {isOwnProfile && 
                        <>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-full" />
                            <Pencil className="absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition text-secondary cursor-pointer" />
                        </>
                        }
                    </div>

                    <ProfilePicDialog
                        open={picDialogOpen}
                        setOpen={setPicDialogOpen}
                        onSelect={setSelectedPic}
                    />
                </div>

                {/* Verification */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Verification:</p>

                    {/* Display a checkmark if verified, otherwise a pencil to verify */}
                    <div className="flex flex-row items-center gap-1.5">
                        {isOwnProfile && 
                            (
                                profileUser?.isVerified ? (
                                    <span className="text-xs sm:text-sm text-green-600">✓</span>
                                ) : (
                                    <Pencil 
                                        className={`w-4 hover:cursor-pointer hover:text-secondary ${changeUsername ? "text-destructive" : ""}`} 
                                        onClick={() => {
                                            setChangeVerification(prev => !prev);
                                            setChangeUsername(false);
                                            setChangeEmail(false);
                                            setChangePassword(false);
                                        }}
                                    />
                                )
                            )
                        }
                        <p className={`font-funnel font-thin text-xs sm:text-sm ${profileUser?.isVerified ? "text-foreground" : "text-destructive"}`}>
                            {profileUser?.isVerified ? "Verified" : "Unverified"}
                        </p>
                    </div>
                </div>

                {/* Change verification */}
                {isOwnProfile && changeVerification && (
                    <ChangeVerificationForm 
                        userId={userId} 
                        changeVerification={changeVerification} 
                        profileUser={profileUser!} 
                        setProfileUser={setProfileUser} 
                        setChangeVerification={setChangeVerification} 
                    />
                )}

                {/* Role */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Role:</p>
                    <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.role ?? "-"}</p>
                </div>

                {/* Username */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Username:</p>

                    <div className="flex flex-row items-center gap-1.5">
                        {isOwnProfile && 
                            <Pencil 
                                className={`w-4 hover:cursor-pointer hover:text-secondary ${changeUsername ? "text-destructive" : ""}`} 
                                onClick={() => {
                                    setChangeUsername(prev => !prev);
                                    setChangeVerification(false);
                                    setChangeEmail(false);
                                    setChangePassword(false);
                                }}
                            />
                        }
                        <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.username ?? "-"}</p>
                    </div>
                </div>

                {/* Change username */}
                {isOwnProfile && changeUsername && (
                    <ChangeUsernameForm userId={userId} changeUsername={changeUsername} profileUser={profileUser!} setProfileUser={setProfileUser} />
                )}

                {/* Email */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Email:</p>
                    <div className="flex flex-row items-center gap-1.5">
                        {isOwnProfile && 
                            <Pencil 
                                className={`w-4 hover:cursor-pointer hover:text-secondary ${changeEmail ? "text-destructive" : ""}`} 
                                onClick={() => {
                                    setChangeEmail(prev => !prev); 
                                    setChangeVerification(false);
                                    setChangeUsername(false);
                                    setChangePassword(false);
                                }}
                            />
                        }
                        <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.email ?? "-"}</p>
                    </div>
                </div>

                {/* Change email */}
                {isOwnProfile && changeEmail && (
                    <ChangeEmailForm userId={userId} changeEmail={changeEmail} profileUser={profileUser!} setProfileUser={setProfileUser} />
                )}

                {/* Password */}
                {isOwnProfile && 
                    <div className="flex flex-row items-center justify-center p-2 gap-5">
                        <Button variant="outline" 
                        className={`font-medium font-funnel hover:bg-secondary hover:text-background hover:cursor-pointer ${changePassword ? "text-destructive" : ""}`}
                        onClick={() => {
                            setChangePassword(prev => !prev);
                            setChangeVerification(false);
                            setChangeUsername(false);
                            setChangeEmail(false);
                        }}>
                            {changePassword ? "Cancel Change" : "Change Password"}
                        </Button>
                    </div>
                }

                {/* Change password form */}
                {isOwnProfile && changePassword && (
                    <ChangePasswordForm userId={userId} changePassword={changePassword} />
                )}

                {serverError && (
                    <p className="text-destructive text-sm text-center mt-2">{serverError}</p>
                )}
            </div>  

            {/* Contributions and recent activity container */}
            <div className="flex flex-col gap-2 self-center w-3/4 sm:w-2/4 lg:w-2/5 xl:w-2/6 ">
                {/* Contributions Sections */}
                <div className="bg-primary p-4 rounded-md">
                    {/* Header */}
                    <h1 className="font-instrument text-base sm:text-lg font-bold">Contributions</h1>
                    <Separator orientation="horizontal" className="my-1 bg-secondary" />

                    <div className="flex flex-row justify-center gap-2 p-3">
                        <Button 
                            size="xs" 
                            variant={chartMode === "month" ? "secondary" : "ghost"} 
                            onClick={() => setChartMode("month")}
                            className="hover:cursor-pointer hover:text-foreground"
                        >
                            This Month
                        </Button>
                        <Button 
                            size="xs" 
                            variant={chartMode === "year" ? "secondary" : "ghost"} 
                            onClick={() => setChartMode("year")}
                            className="hover:cursor-pointer hover:text-foreground"
                        >
                            This Year
                        </Button>
                        <Button 
                            size="xs" 
                            variant={chartMode === "all" ? "secondary" : "ghost"} 
                            onClick={() => setChartMode("all")}
                            className="hover:cursor-pointer hover:text-foreground"
                        >
                            All Time
                        </Button>
                    </div>

                    {/* Chart */}
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart data={chartData} barGap={4} barCategoryGap="20%">
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="label" tickLine={false} tickMargin={10} axisLine={false} />
                            <ChartTooltip content={<ChartTooltipContent />} />

                            <Bar dataKey="sections" fill="#E6CE53" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="definitions" fill="#67D1FD" radius={[4, 4, 0, 0]} />
                            <ChartLegend />
                        </BarChart>
                    </ChartContainer>
                </div>
                {/* Recent Activity Section */}
                <div className="bg-primary p-3 sm:p-4 rounded-md">
                    {/* Header */}
                    <h1 className="font-instrument text-base sm:text-lg font-bold">Recent Activity</h1>
                    <Separator orientation="horizontal" className="my-1 bg-secondary" />
                    {/* Populate recent activity */}
                    <div className="flex flex-col gap-2">
                        {recentContributions.map((contribution) => { 
                            const courseId = contribution.courseCode.toLowerCase().replace(" ","-")

                            // Color activity backgrounds depending on the type of contribution
                            const contributionBg = contribution.type === "section"
                                ? "#E6CE53"
                                : contribution.type === "definition"
                                ? "#67D1FD"
                                : "#ffffff";

                            return (
                                <div key={contribution.refId} className={`flex flex-row justify-between p-2 rounded-lg text-background`} style={{ backgroundColor: contributionBg }}>
                                    <p className="font-instrument font-light text-sm sm:text-base">
                                        <Link
                                            to={`/course/${courseId}`}
                                            className="hover:underline hover:text-foreground"
                                        >
                                            {contribution.courseCode}
                                        </Link> 
                                    </p>
                                    <p className="font-instrument font-medium text-sm sm:text-base">
                                        {new Date(contribution.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                            );
                        })}

                        {recentContributions.length === 0 && (
                            <p className="font-instrument font-light text-sm sm:text-base text-muted-foreground">
                                No recent activity.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}