"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { acceptInvitation, revokeSession, signIn } from "@/server/auth/core";
import { clearSessionCookie, readSessionToken, requestUserAgent, setSessionCookie } from "@/server/auth/session";
import { toFormError, type FormState } from "./form-state";
import { THEME_COOKIE } from "@/lib/constants";


async function syncThemeCookie(userId: string) {
  const pref = await prisma.userPreference.findUnique({ where: { userId }, select: { theme: true } });
  (await cookies()).set(THEME_COOKIE, pref?.theme ?? "system", { path: "/", sameSite: "lax", maxAge: 365 * 86400 });
}

function safeNext(next: FormDataEntryValue | null): string {
  const n = typeof next === "string" ? next : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/\\") ? n : "/dashboard";
}

export async function signInAction(_prev: FormState, form: FormData): Promise<FormState> {
  let userId: string;
  try {
    const s = await signIn(prisma, { email: form.get("email"), password: form.get("password") }, { userAgent: await requestUserAgent() });
    await setSessionCookie(s.token, s.expiresAt);
    userId = s.userId;
  } catch (e) {
    return { ...toFormError(e), data: { email: String(form.get("email") ?? "") } };
  }
  await syncThemeCookie(userId);
  redirect(safeNext(form.get("next")));
}

export async function acceptInviteAction(_prev: FormState, form: FormData): Promise<FormState> {
  if (form.get("password") !== form.get("confirm")) return { error: "Passwords do not match.", data: { name: String(form.get("name") ?? "") } };
  try {
    const { session } = await acceptInvitation(
      prisma,
      { token: form.get("token"), name: form.get("name"), password: form.get("password") },
      { userAgent: await requestUserAgent() },
    );
    await setSessionCookie(session.token, session.expiresAt);
  } catch (e) {
    return { ...toFormError(e), data: { name: String(form.get("name") ?? "") } };
  }
  redirect("/dashboard?welcome=1");
}

export async function signOutAction() {
  const token = await readSessionToken();
  if (token) await revokeSession(prisma, token);
  await clearSessionCookie();
  redirect("/sign-in");
}
