import { useContext } from "react";
import { AuthDialogContext } from "./AuthDialogContext";

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext);
  if (!ctx) throw new Error("useAuthDialog must be used within AuthDialogProvider");
  return ctx;
}