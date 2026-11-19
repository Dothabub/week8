import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import type { Permission } from "@/lib/permissions";
import { SESSION_TTL_DAYS, validateSessionToken, type SessionContext } from "./core";

export const SESSION_COOKIE = "ls_session";

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_DAYS * 86400,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function readSessionToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function requestUserAgent() {
  return (await headers()).get("user-agent");
}

/** Cached per request. */
export const getSession = cache(async (): Promise<SessionContext | null> => validateSessionToken(prisma, await readSessionToken()));

export async function requireSession(): Promise<SessionContext> {
  const s = await getSession();
  if (!s) redirect("/sign-in");
  return s;
}

export async function requirePermission(permission: Permission): Promise<SessionContext> {
  const s = await requireSession();
  if (!s.permissions[permission]) redirect("/dashboard?denied=1");
  return s;
}
