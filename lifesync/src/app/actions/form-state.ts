import { ZodError } from "zod";
import { AuthError } from "@/server/auth/errors";

export type FormState = { error?: string; success?: string; data?: Record<string, string> } | null;

/** Maps known errors to safe user-facing messages; logs and hides unexpected ones. */
export function toFormError(e: unknown): FormState {
  if (e instanceof AuthError) return { error: e.message };
  if (e instanceof ZodError) return { error: e.issues[0]?.message ?? "Please check the form." };
  console.error(e);
  return { error: "Something went wrong. Please try again." };
}
