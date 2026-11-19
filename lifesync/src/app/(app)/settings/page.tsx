import type { Metadata } from "next";
import { Camera, KeyRound, Monitor, Palette, UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireSession } from "@/server/auth/session";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle, type ThemePref } from "@/components/layout/theme";
import { removeAvatarAction, setThemeAction, signOutOtherDevicesAction } from "@/app/actions/settings";
import { AvatarForm, PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const ctx = await requireSession();
  const [pref, avatar, sessions] = await Promise.all([
    prisma.userPreference.findUnique({ where: { userId: ctx.user.id }, select: { theme: true } }),
    prisma.userAvatar.findUnique({ where: { userId: ctx.user.id }, select: { updatedAt: true } }),
    prisma.session.findMany({ where: { userId: ctx.user.id, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" }, select: { id: true, userAgent: true, createdAt: true, lastSeenAt: true } }),
  ]);
  const fmt = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(d);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader icon={<UserRound className="h-4 w-4" />} title="Profile" description={ctx.user.email} />
        <CardBody><ProfileForm name={ctx.user.name} /></CardBody>
      </Card>

      <Card>
        <CardHeader icon={<Camera className="h-4 w-4" />} title="Profile photo" description="JPEG, PNG or WebP, up to 512 KB. Visible only to your household." />
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar name={ctx.user.name} userId={ctx.user.id} hasImage={!!avatar} version={avatar?.updatedAt.getTime().toString(36)} size={64} />
          <div className="flex-1 space-y-3">
            <AvatarForm />
            {avatar && <form action={removeAvatarAction}><Button type="submit" variant="ghost" size="sm">Remove photo</Button></form>}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<Palette className="h-4 w-4" />} title="Appearance" description="Saved to your account and used on every device." />
        <CardBody><ThemeToggle initial={(pref?.theme as ThemePref) ?? "system"} onPersist={setThemeAction} /></CardBody>
      </Card>

      <Card>
        <CardHeader icon={<KeyRound className="h-4 w-4" />} title="Password" description="Changing it signs out your other devices." />
        <CardBody><PasswordForm /></CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader icon={<Monitor className="h-4 w-4" />} title="Active sessions" description={`${sessions.length} signed-in ${sessions.length === 1 ? "device" : "devices"}`}
          action={sessions.length > 1 ? <form action={signOutOtherDevicesAction}><Button type="submit" variant="secondary" size="sm">Sign out other devices</Button></form> : undefined} />
        <CardBody className="pt-2">
          <ul className="divide-y divide-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="truncate text-[13px] text-fg">{describeAgent(s.userAgent)}{s.id === ctx.sessionId && <span className="ml-2 text-[12px] font-medium text-accent">This device</span>}</span>
                <span className="text-[12px] text-muted">Signed in {fmt(s.createdAt)}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

function describeAgent(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}
