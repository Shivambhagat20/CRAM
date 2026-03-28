import { createContext } from "react";

// Mode types
export type AuthMode = "login" | "signup";

export interface AuthDialogContextValue {
  openAuthDialog: (mode?: AuthMode) => void;
}

// Use react context to control the authDialog globally
export const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);