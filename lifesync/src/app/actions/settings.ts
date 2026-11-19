"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { personName } from "@/lib/validation/common";
import {
  changePassword, createInvitation, revokeAllSessions, revokeInvitation, setMemberActive, updateMemberPermissions, updateMemberRole,
} from "@/server/auth/core";
import { requireSession } from "@/server/auth/session";
import { MAX_AVATAR_BYTES, sniffImageType } from "@/server/avatar";
import { toFormError, type FormState } from "./form-state";
import { THEME_COOKIE } from "@/lib/constants";

// ── Profile ────────────────────────────────────────────────────────────────

export async function updateProfileAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const ctx = await requireSession();
    const name = personName.parse(form.get("name"));
    await prisma.$transaction([
      prisma.user.update({ where: { id: ctx.user.id }, data: { name } }),
      prisma.auditLog.create({ data: { householdId: ctx.membership.householdId, actorId: ctx.user.id, action: "UPDATE", entityType: "User", entityId: ctx.user.id, before: { name: ctx.user.name }, after: { name } } }),
    ]);
    revalidatePath("/", "layout");
    return { success: "Profile updated." };
  } catch (e) { return toFormError(e); }
}

export async function uploadAvatarAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const ctx = await requireSession();
    const file = form.get("avatar");
    if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
    if (file.size > MAX_AVATAR_BYTES) return { error: "Image must be 512 KB or smaller." };
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = sniffImageType(bytes);
    if (!mimeType) return { error: "Only JPEG, PNG or WebP images are allowed." };
    await prisma.userAvatar.upsert({
      where: { userId: ctx.user.id },
      create: { userId: ctx.user.id, mimeType, data: Buffer.from(bytes) },
      update: { mimeType, data: Buffer.from(bytes) },
    });
    revalidatePath("/settings");
    return { success: "Profile photo updated." };
  } catch (e) { return toFormError(e); }
}

export async function removeAvatarAction(): Promise<void> {
  const ctx = await requireSession();
  await prisma.userAvatar.deleteMany({ where: { userId: ctx.user.id } });
  revalidatePath("/", "layout");
}

const themeSchema = z.enum(["system", "light", "dark"]);

export async function setThemeAction(theme: string): Promise<void> {
  const ctx = await requireSession();
  const t = themeSchema.parse(theme);
  await prisma.userPreference.upsert({ where: { userId: ctx.user.id }, create: { userId: ctx.user.id, theme: t }, update: { theme: t } });
  (await cookies()).set(THEME_COOKIE, t, { path: "/", sameSite: "lax", maxAge: 365 * 86400 });
}

export async function changePasswordAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const ctx = await requireSession();
    if (form.get("next") !== form.get("confirm")) return { error: "New passwords do not match." };
    await changePassword(prisma, ctx, String(form.get("current") ?? ""), String(form.get("next") ?? ""));
    return { success: "Password changed. Other devices have been signed out." };
  } catch (e) { return toFormError(e); }
}

export async function signOutOtherDevicesAction(): Promise<void> {
  const ctx = await requireSession();
  await revokeAllSessions(prisma, ctx.user.id, ctx.sessionId);
  revalidatePath("/settings");
}

// ── Members (admin) ────────────────────────────────────────────────────────

export async function inviteMemberAction(_p: FormState, form: FormData): Promise<FormState> {
  try {
    const ctx = await requireSession();
    const { token, invitation } = await createInvitation(prisma, ctx, { email: form.get("email"), role: form.get("role") || "MEMBER" });
    revalidatePath("/settings/members");
    const base = process.env.APP_URL ?? "http://localhost:3000";
    return { success: `Invitation created for ${invitation.email}. Share this one-time link (valid 72 hours):`, data: { link: `${base}/invite/${token}` } };
  } catch (e) { return toFormError(e); }
}

export async function revokeInvitationAction(invitationId: string): Promise<FormState> {
  try {
    const ctx = await requireSession();
    await revokeInvitation(prisma, ctx, z.string().min(1).parse(invitationId));
    revalidatePath("/settings/members");
    return { success: "Invitation revoked." };
  } catch (e) { return toFormError(e); }
}

export async function updateRoleAction(membershipId: string, role: string): Promise<FormState> {
  try {
    const ctx = await requireSession();
    await updateMemberRole(prisma, ctx, membershipId, z.enum(["ADMIN", "MEMBER"]).parse(role));
    revalidatePath("/settings/members");
    return { success: "Role updated." };
  } catch (e) { return toFormError(e); }
}

export async function updatePermissionAction(membershipId: string, permission: string, value: boolean): Promise<FormState> {
  try {
    const ctx = await requireSession();
    const p = z.enum(PERMISSIONS).parse(permission) as Permission;
    const target = await prisma.membership.findFirst({ where: { id: membershipId, householdId: ctx.membership.householdId } });
    if (!target) return { error: "Member not found." };
    const current = (target.permissions ?? {}) as Partial<Record<Permission, boolean>>;
    await updateMemberPermissions(prisma, ctx, membershipId, { ...current, [p]: z.boolean().parse(value) });
    revalidatePath("/settings/members");
    return { success: "Permission updated." };
  } catch (e) { return toFormError(e); }
}

export async function setMemberActiveAction(membershipId: string, active: boolean): Promise<FormState> {
  try {
    const ctx = await requireSession();
    await setMemberActive(prisma, ctx, membershipId, active);
    revalidatePath("/settings/members");
    return { success: active ? "Member reactivated." : "Member deactivated and signed out." };
  } catch (e) { return toFormError(e); }
}
