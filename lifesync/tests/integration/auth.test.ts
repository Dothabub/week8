import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapHousehold } from "@/server/bootstrap";
import {
  acceptInvitation, changePassword, createInvitation, revokeInvitation, setMemberActive, signIn,
  updateMemberPermissions, updateMemberRole, validateSessionToken, MAX_FAILED_LOGINS,
} from "@/server/auth/core";
import { AuthError } from "@/server/auth/errors";
import { hashToken } from "@/lib/tokens";
import { db, wipe } from "../helpers/db";

const PW = "CorrectHorse42";

async function householdWithThree() {
  const { inviteToken } = await bootstrapHousehold(db, { householdName: "Home", adminEmail: "admin@example.com" });
  const a = await acceptInvitation(db, { token: inviteToken, name: "Ayesha", password: PW });
  const admin = (await validateSessionToken(db, a.session.token))!;
  const i2 = await createInvitation(db, admin, { email: "Bilal@Example.com" });
  const i3 = await createInvitation(db, admin, { email: "cara@example.com" });
  const b = await acceptInvitation(db, { token: i2.token, name: "Bilal", password: PW });
  const c = await acceptInvitation(db, { token: i3.token, name: "Cara", password: PW });
  return {
    admin,
    bilal: (await validateSessionToken(db, b.session.token))!,
    cara: (await validateSessionToken(db, c.session.token))!,
  };
}

beforeEach(wipe);
afterAll(async () => { await wipe(); await db.$disconnect(); });

describe("invitations & three-member household", () => {
  it("three members can join and each signs in (test scenario 1)", async () => {
    const { admin, bilal, cara } = await householdWithThree();
    expect([admin.membership.seat, bilal.membership.seat, cara.membership.seat].sort()).toEqual([1, 2, 3]);
    expect(admin.membership.role).toBe("ADMIN");
    expect(bilal.membership.role).toBe("MEMBER");
    expect(bilal.user.email).toBe("bilal@example.com");
    for (const email of ["admin@example.com", "bilal@example.com", "cara@example.com"]) {
      const s = await signIn(db, { email, password: PW });
      expect(await validateSessionToken(db, s.token)).not.toBeNull();
    }
    const stored = await db.user.findFirstOrThrow({ where: { email: "cara@example.com" } });
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it("blocks a fourth invitation and counts pending invites against seats", async () => {
    const { admin } = await householdWithThree();
    await expect(createInvitation(db, admin, { email: "dan@example.com" })).rejects.toThrow(/exactly three/);
  });

  it("invitation tokens are single-use, revocable and expire", async () => {
    const { inviteToken } = await bootstrapHousehold(db, { householdName: "Home", adminEmail: "admin@example.com" });
    const a = await acceptInvitation(db, { token: inviteToken, name: "A", password: PW });
    await expect(acceptInvitation(db, { token: inviteToken, name: "A", password: PW })).rejects.toThrow(/invalid, expired|already/);
    const admin = (await validateSessionToken(db, a.session.token))!;

    const i = await createInvitation(db, admin, { email: "b@example.com" });
    await revokeInvitation(db, admin, i.invitation.id);
    await expect(acceptInvitation(db, { token: i.token, name: "B", password: PW })).rejects.toThrow(AuthError);

    const j = await createInvitation(db, admin, { email: "b@example.com" });
    await db.invitation.update({ where: { id: j.invitation.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    await expect(acceptInvitation(db, { token: j.token, name: "B", password: PW })).rejects.toThrow(AuthError);
  });

  it("rejects weak passwords on acceptance", async () => {
    const { inviteToken } = await bootstrapHousehold(db, { householdName: "Home", adminEmail: "admin@example.com" });
    await expect(acceptInvitation(db, { token: inviteToken, name: "A", password: "password" })).rejects.toThrow();
    expect(await db.user.count()).toBe(0);
  });
});

describe("sign-in security", () => {
  it("uses a generic error for unknown e-mail and wrong password", async () => {
    await householdWithThree();
    await expect(signIn(db, { email: "nobody@example.com", password: PW })).rejects.toThrow("Incorrect e-mail or password.");
    await expect(signIn(db, { email: "cara@example.com", password: "WrongPass123" })).rejects.toThrow("Incorrect e-mail or password.");
  });

  it("locks the account after repeated failures", async () => {
    await householdWithThree();
    for (let i = 0; i < MAX_FAILED_LOGINS; i++) {
      await expect(signIn(db, { email: "cara@example.com", password: "WrongPass123" })).rejects.toThrow();
    }
    await expect(signIn(db, { email: "cara@example.com", password: PW })).rejects.toMatchObject({ code: "LOCKED" });
  });

  it("stores only hashed session tokens and rejects expired sessions", async () => {
    await householdWithThree();
    const s = await signIn(db, { email: "cara@example.com", password: PW });
    const row = await db.session.findUniqueOrThrow({ where: { tokenHash: hashToken(s.token) } });
    expect(row.tokenHash).not.toBe(s.token);
    await db.session.update({ where: { id: row.id }, data: { expiresAt: new Date(Date.now() - 1) } });
    expect(await validateSessionToken(db, s.token)).toBeNull();
    expect(await validateSessionToken(db, "garbage")).toBeNull();
  });

  it("password change revokes other sessions", async () => {
    const { cara } = await householdWithThree();
    const other = await signIn(db, { email: "cara@example.com", password: PW });
    await changePassword(db, cara, PW, "NewPassword99");
    expect(await validateSessionToken(db, other.token)).toBeNull();
    expect(await validateSessionToken(db, (await signIn(db, { email: "cara@example.com", password: "NewPassword99" })).token)).not.toBeNull();
  });
});

describe("role-based access (test scenario 21)", () => {
  it("members cannot manage members", async () => {
    const { bilal, cara } = await householdWithThree();
    await expect(createInvitation(db, bilal, { email: "x@example.com" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateMemberRole(db, bilal, cara.membership.id, "ADMIN")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(setMemberActive(db, bilal, cara.membership.id, false)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin can grant permissions, and the last admin cannot be demoted or deactivated", async () => {
    const { admin, bilal } = await householdWithThree();
    await updateMemberPermissions(db, admin, bilal.membership.id, { manageHouseholdFinances: true });
    const refreshed = await signIn(db, { email: "bilal@example.com", password: PW });
    expect((await validateSessionToken(db, refreshed.token))!.permissions.manageHouseholdFinances).toBe(true);
    await expect(updateMemberRole(db, admin, admin.membership.id, "MEMBER")).rejects.toThrow(/at least one active admin/);
    await expect(setMemberActive(db, admin, admin.membership.id, false)).rejects.toThrow(/yourself/);
  });

  it("deactivating a member ends their sessions", async () => {
    const { admin, cara } = await householdWithThree();
    const s = await signIn(db, { email: "cara@example.com", password: PW });
    await setMemberActive(db, admin, cara.membership.id, false);
    expect(await validateSessionToken(db, s.token)).toBeNull();
    await expect(signIn(db, { email: "cara@example.com", password: PW })).rejects.toThrow();
  });

  it("cannot act on memberships of another household", async () => {
    const { admin } = await householdWithThree();
    const otherHousehold = await db.household.create({ data: { name: "Other" } });
    const u = await db.user.create({ data: { email: "z@example.com", name: "Z" } });
    const m = await db.membership.create({ data: { householdId: otherHousehold.id, userId: u.id, seat: 1 } });
    await expect(updateMemberRole(db, admin, m.id, "ADMIN")).rejects.toThrow(/not found/);
  });

  it("writes an audit trail", async () => {
    await householdWithThree();
    const actions = (await db.auditLog.findMany()).map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(["BOOTSTRAP", "JOIN", "INVITE"]));
  });
});
