import { useEffect, useState } from "react";
import { getCurrentUser } from "@/api/userApi";
import { AuthContext, type User } from "./AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    // Boolean for quick authentication checks
    const isAuthenticated = !!user; 

    // check session on first load
    useEffect(() => {
        // Set user if the session is valid otherwise reset the user
        getCurrentUser()
        .then((u) => setUser(u))
        .catch(() => setUser(null));
    }, []);

    return (
        // Provide auth state 
        <AuthContext.Provider value={{ user, isAuthenticated, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}