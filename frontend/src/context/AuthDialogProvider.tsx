"use client";

import { useState, type ReactNode } from "react";
import AuthDialog from "@/components/auth/AuthDialog";
import { AuthDialogContext, type AuthMode } from "./AuthDialogContext";

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  
  // Open the dialog and optionally switch the dialog mode
  const openAuthDialog = (newMode: AuthMode = "login") => {
    setMode(newMode);
    setOpen(true);
  };

  return (
    <AuthDialogContext.Provider value={{ openAuthDialog }}>
      {children}
      
      {/* Component is controlled by the provider state */}
      <AuthDialog open={open} mode={mode} setOpen={setOpen} setMode={setMode} />
    </AuthDialogContext.Provider>
  );
}