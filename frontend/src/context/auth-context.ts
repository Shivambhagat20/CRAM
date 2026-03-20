import { createContext } from "react";

// what session cookie has
export interface User {
    id: string;
    email: string;
    username: string;
    role: string;
    profilePic?: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean; // signed in
    setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);