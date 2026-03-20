import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Pencil } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent,ChartLegend, ChartLegendContent, type ChartConfig } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import { useState, useEffect } from "react";
import ProfilePicDialog from "@/components/profile/ProfilePicDialog";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "react-router-dom";
import { AVATAR_MAP } from "@/constants/avatars";
import { getUserById, updateUser } from "@/api/userApi";

interface ProfileUser {
    id: string;
    username: string;
    email: string;
    role: string;
    profilePic?: string;
}

export default function Profile() {
    const { userId } = useParams();
    const { user, setUser } = useAuth(); // current logged-in user
    const [profileUser, setProfileUser] = useState<ProfileUser | null>(null); // details of the profile user
    const [picDialogOpen, setPicDialogOpen] = useState(false);
    const [selectedPic, setSelectedPic] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    // render profile change components if the profile belongs to the user
    const isOwnProfile = user?.id === userId;

    // Chart data, can be any kind of data we can decide on what we want to display
    const chartData = [
        { month: "January", desktop: 186, mobile: 80 },
        { month: "February", desktop: 305, mobile: 200 },
        { month: "March", desktop: 237, mobile: 120 },
        { month: "April", desktop: 73, mobile: 190 },
        { month: "May", desktop: 209, mobile: 130 },
        { month: "June", desktop: 214, mobile: 140 },
    ];

    // Configures the chart labels and color
    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "#2563eb",
        },
        mobile: {
            label: "Mobile",
            color: "#60a5fa",
        },
    } satisfies ChartConfig

    // update the profile user details based on the id of the page
    useEffect(() => {
        if (!userId) return;

        const update = async () => {
            try {
                setServerError(null);
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

    return(
        <div className="flex flex-col sm:flex-row my-5 gap-3 justify-center w-full">
            {/* Profile management section */}
            <div className="flex flex-col gap-2 p-3 self-center bg-primary rounded-md sm:p-4 w-3/4 sm:w-2/5 xl:w-1/4 sm:self-start">
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

                {/* Role */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Role:</p>
                    <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.role ?? "-"}</p>
                </div>

                {/* Username */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Username:</p>

                    <div className="flex flex-row items-center gap-1.5">
                        {isOwnProfile && <Pencil className="w-4 hover:cursor-pointer hover:text-secondary"/>}
                        <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.username ?? "-"}</p>
                    </div>
                </div>

                {/* Email */}
                <div className="flex flex-row items-center justify-between sm:p-2 gap-5">
                    <p className="font-funnel font-thin text-sm sm:text-base text-foreground">Email:</p>
                    <div className="flex flex-row items-center gap-1.5">
                        {isOwnProfile && <Pencil className="w-4 hover:cursor-pointer hover:text-secondary"/>}
                        <p className="font-funnel font-thin text-xs sm:text-sm text-foreground">{profileUser?.email ?? "-"}</p>
                    </div>
                </div>

                {/* Password */}
                {isOwnProfile && 
                <div className="flex flex-row items-center justify-center p-2 gap-5">
                    <Button variant="outline" className=" font-medium font-funnel hover:bg-secondary hover:text-background hover:cursor-pointer">Change Password</Button>
                </div>}

                {serverError && (
                    <p className="text-destructive text-sm text-center mt-2">
                        {serverError}
                    </p>
                )}

            </div>  

            {/* Contributions and recent activity container */}
            <div className="flex flex-col gap-2 self-center w-3/4 sm:w-2/4 lg:w-2/5 xl:w-2/6 ">
                {/* Contributions Sections */}
                <div className="bg-primary p-4 rounded-md">
                    {/* Header */}
                    <h1 className="font-instrument text-base sm:text-lg font-bold">Contributions</h1>
                    <Separator orientation="horizontal" className="my-1 bg-secondary" />

                    {/* Chart */}
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={chartData}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <ChartTooltip content={<ChartTooltipContent/>} />
                            <ChartLegend content={<ChartLegendContent />} />
                            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </div>
                {/* Recent Activity Section */}
                <div className="bg-primary p-3 sm:p-4 rounded-md">
                    {/* Header */}
                    <h1 className="font-instrument text-base sm:text-lg font-bold">Recent Activity</h1>
                    <Separator orientation="horizontal" className="my-1 bg-secondary" />
                    {/* Populate recent activity */}
                    <div className="flex flew-row justify-between bg-background p-2 rounded-lg">
                        <p className="font-instrument font-light text-sm sm:text-base">Course: {}</p>
                        <p className="font-instrument font-medium text-sm sm:text-base">Date: {}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}