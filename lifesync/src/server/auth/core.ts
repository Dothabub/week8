/**
 * Framework-independent authentication & membership logic. Takes a Prisma client
 * so it can be tested directly against a database; cookie handling lives in
 * ./session.ts (Next.js specific).
 */
import type { Membership, PrismaClient, Role, User } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { generateToken, hashToken } from "@/lib/tokens";
import { can, resolvePermissions, type Permission } from "@/lib/permissions";
import { acceptInviteSchema, inviteSchema, signInSchema } from "@/lib/validation";
import { INVITATION_TTL_HOURS } from "../defaults";
import { hashPassword, verifyPassword } from "./password";
import { AuthError } from "./errors";

export const SESSION_TTL_DAYS = 30;
export const SESSION_REFRESH_AFTER_MS = 24 * 3600_000;
export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
export const MAX_MEMBERS = 3;

type Db = PrismaClient | Prisma.TransactionClient;

export interface SessionContext {
  sessionId: string;
  user: Pick<User, "id" | "email" | "name"> & { hasAvatar: boolean };
  membership: Pick<Membership, "id" | "householdId" | "role" | "seat" | "permissions">;
  permissions: Record<Permission, boolean>;
}

// ── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(db: Db, userId: string, meta: { userAgent?: string | null } = {}) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000);
  await db.session.create({
    data: { userId, tokenHash: hashToken(token), expiresAt, userAgent: meta.userAgent?.slice(0, 300) ?? null },
  });
  return { token, expiresAt };
}

/** Resolves a raw cookie token to an active session with an active membership. */
export async function validateSessionToken(db: PrismaClient, token: string | undefined | null): Promise<SessionContext | null> {
  if (!token || token.length > 200) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { include: { membership: true, avatar: { select: { userId: true } } } } },
  });
  if (!session) return null;
  const now = Date.now();
  if (session.expiresAt.getTime() <= now) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  const m = session.user.membership;
  if (!m || !m.active) return null;
  if (now - session.lastSeenAt.getTime() > SESSION_REFRESH_AFTER_MS) {
    // Sliding expiry, written at most once a day.
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(now), expiresAt: new Date(now + SESSION_TTL_DAYS * 86400_000) },
    });
  }
  return {
    sessionId: session.id,
    user: { id: session.user.id, email: session.user.email, name: session.user.name, hasAvatar: !!session.user.avatar },
    membership: { id: m.id, householdId: m.householdId, role: m.role, seat: m.seat, permissions: m.permissions },
    permissions: resolvePermissions(m.role, m.permissions),
  };
}

export async function revokeSession(db: Db, token: string) {
  await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
}

export async function revokeAllSessions(db: Db, userId: string, exceptSessionId?: string) {
  await db.session.deleteMany({ where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) } });
}

export function assertPermission(ctx: SessionContext, permission: Permission) {
  if (!ctx.permissions[permission]) throw new AuthError("You don't have permission to do that.", "FORBIDDEN");
}

// ── Sign-in ─────────────────────────────────────────────────────────────────

const GENERIC_LOGIN_ERROR = "Incorrect e-mail or password.";

export async function signIn(db: PrismaClient, raw: unknown, meta: { userAgent?: string | null } = {}) {
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) throw new AuthError(GENERIC_LOGIN_ERROR);
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email }, include: { membership: true } });
  if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    await verifyPassword(password, null); // keep timing uniform
    throw new AuthError(`Too many attempts. Try again after ${user.lockedUntil.toISOString().slice(11, 16)} UTC.`, "LOCKED");
  }
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok || !user.membership?.active) {
    if (user) {
      const failed = user.failedLoginCount + 1;
      await db.user.update({
        where: { id: user.id },
        data: failed >= MAX_FAILED_LOGINS
          ? { failedLoginCount: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60_000) }
          : { failedLoginCount: failed },
      });
    }
    throw new AuthError(GENERIC_LOGIN_ERROR);
  }

  return db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const s = await createSession(tx, user.id, meta);
    await tx.auditLog.create({
      data: { householdId: user.membership!.householdId, actorId: user.id, action: "LOGIN", entityType: "User", entityId: user.id },
    });
    return { ...s, userId: user.id };
  });
}

// ── Invitations ─────────────────────────────────────────────────────────────

export async function createInvitation(db: PrismaClient, actor: SessionContext, raw: unknown) {
  assertPermission(actor, "manageMembers");
  const { email, role } = inviteSchema.parse(raw);
  const householdId = actor.membership.householdId;
  const token = generateToken();

  const invitation = await db.$transaction(async (tx) => {
    const [members, pending, existingUser] = await Promise.all([
      tx.membership.count({ where: { householdId, active: true } }),
      tx.invitation.count({ where: { householdId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }),
      tx.user.findUnique({ where: { email }, include: { membership: true } }),
    ]);
    if (existingUser?.membership) throw new AuthError("That person is already a member.", "CONFLICT");
    if (members + pending >= MAX_MEMBERS) {
      throw new AuthError("LifeSync supports exactly three members. Revoke a pending invitation or deactivate a member first.", "CONFLICT");
    }
    // Replace any stale (expired) pending invite for this e-mail.
    await tx.invitation.updateMany({ where: { householdId, email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const inv = await tx.invitation.create({
      data: { householdId, email, role, tokenHash: hashToken(token), invitedById: actor.user.id, expiresAt: new Date(Date.now() + INVITATION_TTL_HOURS * 3600_000) },
    });
    await tx.auditLog.create({
      data: { householdId, actorId: actor.user.id, action: "INVITE", entityType: "Invitation", entityId: inv.id, after: { email, role } },
    });
    return inv;
  });
  return { invitation, token };
}

export async function revokeInvitation(db: PrismaClient, actor: SessionContext, invitationId: string) {
  assertPermission(actor, "manageMembers");
  const res = await db.invitation.updateMany({
    where: { id: invitationId, householdId: actor.membership.householdId, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (res.count === 0) throw new AuthError("Invitation not found or already used.");
  await db.auditLog.create({
    data: { householdId: actor.membership.householdId, actorId: actor.user.id, action: "REVOKE", entityType: "Invitation", entityId: invitationId },
  });
}

/** Returns the invitation if the token is valid and unused, else null. */
export async function findUsableInvitation(db: PrismaClient, token: string) {
  if (!token || token.length > 200) return null;
  const inv = await db.invitation.findUnique({ where: { tokenHash: hashToken(token) }, include: { household: { select: { name: true } } } });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt.getTime() <= Date.now()) return null;
  return inv;
}

export async function acceptInvitation(db: PrismaClient, raw: unknown, meta: { userAgent?: string | null } = {}) {
  const { token, name, password } = acceptInviteSchema.parse(raw);
  const inv = await findUsableInvitation(db, token);
  if (!inv) throw new AuthError("This invitation link is invalid, expired or has already been used.");
  const passwordHash = await hashPassword(password);

  try {
    return await db.$transaction(
      async (tx) => {
        // Re-check inside the transaction (single use).
        const claimed = await tx.invitation.updateMany({
          where: { id: inv.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
          data: { acceptedAt: new Date() },
        });
        if (claimed.count !== 1) throw new AuthError("This invitation has already been used.");

        const taken = (await tx.membership.findMany({ where: { householdId: inv.householdId }, select: { seat: true } })).map((m) => m.seat);
        const seat = [1, 2, 3].find((s) => !taken.includes(s));
        if (!seat) throw new AuthError("This household already has three members.", "CONFLICT");

        const existing = await tx.user.findUnique({ where: { email: inv.email }, include: { membership: true } });
        if (existing?.membership) throw new AuthError("This e-mail already belongs to a member.", "CONFLICT");
        const user = existing
          ? await tx.user.update({ where: { id: existing.id }, data: { name, passwordHash, emailVerifiedAt: new Date() } })
          : await tx.user.create({ data: { email: inv.email, name, passwordHash, emailVerifiedAt: new Date() } });

        await tx.membership.create({ data: { householdId: inv.householdId, userId: user.id, role: inv.role, seat } });
        await tx.userPreference.create({ data: { userId: user.id } });
        await tx.auditLog.create({
          data: { householdId: inv.householdId, actorId: user.id, action: "JOIN", entityType: "Membership", entityId: user.id, after: { role: inv.role, seat } },
        });
        const session = await createSession(tx, user.id, meta);
        return { user, session };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (e) {
    if (e instanceof AuthError) throw e;
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2034")) {
      throw new AuthError("Someone else joined at the same moment. Please try again.", "CONFLICT");
    }
    throw e;
  }
}

// ── Member management (admin) ───────────────────────────────────────────────

async function loadTarget(db: Db, actor: SessionContext, membershipId: string) {
  const target = await db.membership.findFirst({ where: { id: membershipId, householdId: actor.membership.householdId } });
  if (!target) throw new AuthError("Member not found.");
  return target;
}

async function assertNotLastAdmin(db: Db, householdId: string, membershipId: string) {
  const otherAdmins = await db.membership.count({ where: { householdId, role: "ADMIN", active: true, id: { not: membershipId } } });
  if (otherAdmins === 0) throw new AuthError("The household must keep at least one active admin.", "CONFLICT");
}

export async function updateMemberRole(db: PrismaClient, actor: SessionContext, membershipId: string, role: Role) {
  assertPermission(actor, "manageMembers");
  return db.$transaction(async (tx) => {
    const target = await loadTarget(tx, actor, membershipId);
    if (target.role === role) return target;
    if (target.role === "ADMIN" && role !== "ADMIN") await assertNotLastAdmin(tx, target.householdId, target.id);
    const updated = await tx.membership.update({ where: { id: target.id }, data: { role } });
    await tx.auditLog.create({
      data: { householdId: target.householdId, actorId: actor.user.id, action: "ROLE_CHANGE", entityType: "Membership", entityId: target.id, before: { role: target.role }, after: { role } },
    });
    return updated;
  });
}

export async function updateMemberPermissions(db: PrismaClient, actor: SessionContext, membershipId: string, overrides: Partial<Record<Permission, boolean>>) {
  assertPermission(actor, "manageMembers");
  return db.$transaction(async (tx) => {
    const target = await loadTarget(tx, actor, membershipId);
    // Store only valid keys; resolvePermissions also protects locked admin rights.
    const clean = Object.fromEntries(Object.entries(resolvePermissions(target.role, overrides)).filter(([k]) => k in overrides));
    const updated = await tx.membership.update({ where: { id: target.id }, data: { permissions: clean } });
    await tx.auditLog.create({
      data: { householdId: target.householdId, actorId: actor.user.id, action: "PERMISSIONS_CHANGE", entityType: "Membership", entityId: target.id, before: target.permissions as Prisma.InputJsonValue, after: clean },
    });
    return updated;
  });
}

export async function setMemberActive(db: PrismaClient, actor: SessionContext, membershipId: string, active: boolean) {
  assertPermission(actor, "manageMembers");
  return db.$transaction(async (tx) => {
    const target = await loadTarget(tx, actor, membershipId);
    if (!active && target.id === actor.membership.id) throw new AuthError("You cannot deactivate yourself.", "CONFLICT");
    if (!active && target.role === "ADMIN") await assertNotLastAdmin(tx, target.householdId, target.id);
    const updated = await tx.membership.update({ where: { id: target.id }, data: { active } });
    if (!active) await tx.session.deleteMany({ where: { userId: target.userId } });
    await tx.auditLog.create({
      data: { householdId: target.householdId, actorId: actor.user.id, action: active ? "ACTIVATE" : "DEACTIVATE", entityType: "Membership", entityId: target.id },
    });
    return updated;
  });
}

export async function changePassword(db: PrismaClient, actor: SessionContext, current: string, next: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: actor.user.id } });
  if (!(await verifyPassword(current, user.passwordHash))) throw new AuthError("Current password is incorrect.");
  const { password } = acceptInviteSchema.pick({ password: true }).parse({ password: next });
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    await revokeAllSessions(tx, user.id, actor.sessionId);
    await tx.auditLog.create({ data: { householdId: actor.membership.householdId, actorId: user.id, action: "PASSWORD_CHANGE", entityType: "User", entityId: user.id } });
  });
}

export { can };
