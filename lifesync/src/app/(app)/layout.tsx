import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { SIDEBAR_COOKIE } from "@/lib/constants";
import { requireSession } from "@/server/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { setThemeAction } from "@/app/actions/settings";
import { AppShell } from "@/components/layout/app-shell";
import type { ThemePref } from "@/components/layout/theme";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSession();
  const [household, pref, avatar] = await Promise.all([
    prisma.household.findUniqueOrThrow({ where: { id: ctx.membership.householdId }, select: { name: true } }),
    prisma.userPreference.findUnique({ where: { userId: ctx.user.id }, select: { theme: true } }),
    prisma.userAvatar.findUnique({ where: { userId: ctx.user.id }, select: { updatedAt: true } }),
  ]);
  const collapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";
  return (
    <AppShell
      initialCollapsed={collapsed}
      user={{ id: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: ctx.membership.role, hasAvatar: !!avatar, avatarVersion: avatar?.updatedAt.getTime().toString(36) }}
      householdName={household.name}
      theme={(pref?.theme as ThemePref) ?? "system"}
      onTheme={setThemeAction}
      onSignOut={signOutAction}
    >
      {children}
    </AppShell>
  );
}
