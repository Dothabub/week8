import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { bootstrapHousehold } from "@/server/bootstrap";
import { hashToken } from "@/lib/tokens";

import { db, wipe } from "../helpers/db";

async function setup() {
  const { household, inviteToken } = await bootstrapHousehold(db, { householdName: "Test Home", adminEmail: "Admin@Example.com" });
  const users = await Promise.all(
    [1, 2, 3, 4].map((i) => db.user.create({ data: { email: `u${i}@example.com`, name: `User ${i}` } })),
  );
  return { household, inviteToken, users };
}

beforeEach(wipe);
afterAll(async () => {
  await wipe();
  await db.$disconnect();
});

describe("bootstrap", () => {
  it("creates one household, default groceries, Pasta/Filishake and a hashed admin invite", async () => {
    const { household, inviteToken } = await setup();
    expect(household.currency).toBe("GBP");
    expect(await db.groceryProduct.count()).toBe(22);
    const cats = await db.activityCategory.findMany({ orderBy: { key: "asc" } });
    expect(cats.map((c) => c.key)).toEqual(["FILISHAKE", "PASTA"]);
    expect(cats.every((c) => c.description === null)).toBe(true); // meaning not assumed
    const inv = await db.invitation.findFirstOrThrow();
    expect(inv.email).toBe("admin@example.com");
    expect(inv.role).toBe("ADMIN");
    expect(inv.tokenHash).toBe(hashToken(inviteToken));
    expect(inv.tokenHash).not.toContain(inviteToken);
    expect(await db.user.count({ where: { passwordHash: { not: null } } })).toBe(0); // no hard-coded passwords
  });

  it("refuses to create a second household", async () => {
    await setup();
    await expect(bootstrapHousehold(db, { householdName: "Other", adminEmail: "x@example.com" })).rejects.toThrow(/already exists/);
  });
});

describe("integrity constraints", () => {
  it("limits a household to exactly three seats", async () => {
    const { household, users } = await setup();
    for (let i = 0; i < 3; i++) {
      await db.membership.create({ data: { householdId: household.id, userId: users[i].id, seat: i + 1, role: i === 0 ? "ADMIN" : "MEMBER" } });
    }
    await expect(db.membership.create({ data: { householdId: household.id, userId: users[3].id, seat: 4 } })).rejects.toThrow();
    await expect(db.membership.create({ data: { householdId: household.id, userId: users[3].id, seat: 2 } })).rejects.toThrow();
    expect(await db.membership.count()).toBe(3);
  });

  it("rejects upper-case e-mails, negative stock and invalid stock signs", async () => {
    const { household, users } = await setup();
    await expect(db.user.create({ data: { email: "Bad@Example.com", name: "x" } })).rejects.toThrow();
    const rice = await db.groceryProduct.findFirstOrThrow({ where: { name: "Rice" } });
    await expect(db.groceryProduct.update({ where: { id: rice.id }, data: { currentStock: -1 } })).rejects.toThrow();
    await expect(
      db.stockTransaction.create({
        data: { householdId: household.id, productId: rice.id, userId: users[0].id, type: "STOCK_OUT", quantity: 1, signedQuantity: 1, balanceAfter: 0 },
      }),
    ).rejects.toThrow();
    await db.stockTransaction.create({
      data: { householdId: household.id, productId: rice.id, userId: users[0].id, type: "STOCK_IN", quantity: 5, signedQuantity: 5, balanceAfter: 5 },
    });
  });

  it("rejects non-positive time intervals and invalid HH:MM", async () => {
    const { household, users } = await setup();
    const job = await db.job.create({ data: { householdId: household.id, userId: users[0].id, slot: "JOB1", name: "Cafe" } });
    const t = new Date("2026-11-20T09:00:00Z");
    await expect(db.shift.create({ data: { householdId: household.id, jobId: job.id, userId: users[0].id, startAt: t, endAt: t } })).rejects.toThrow();
    await expect(
      db.shiftTemplate.create({ data: { jobId: job.id, isoWeekday: 1, startTime: "9:00", endTime: "17:00", validFrom: new Date("2026-11-16") } }),
    ).rejects.toThrow();
    await expect(db.job.create({ data: { householdId: household.id, userId: users[0].id, slot: "JOB1", name: "Dup" } })).rejects.toThrow(); // one JOB1 per user
  });

  it("rejects negative money and self-settlements", async () => {
    const { household, users } = await setup();
    await expect(
      db.expense.create({ data: { householdId: household.id, category: "FOOD", description: "x", totalAmount: -1, occurredAt: new Date(), paidById: users[0].id, createdById: users[0].id } }),
    ).rejects.toThrow();
    await expect(
      db.settlement.create({ data: { householdId: household.id, fromUserId: users[0].id, toUserId: users[0].id, amount: 5, settledAt: new Date() } }),
    ).rejects.toThrow();
  });

  it("allows only one live weekly plan per week", async () => {
    const { household, users } = await setup();
    const base = { householdId: household.id, weekStart: new Date("2026-11-23"), engineVersion: "rules-1", inputSnapshot: {}, createdById: users[0].id };
    await db.weeklyPlan.create({ data: { ...base, version: 1 } });
    await expect(db.weeklyPlan.create({ data: { ...base, version: 2 } })).rejects.toThrow();
    await db.weeklyPlan.updateMany({ data: { status: "SUPERSEDED" } });
    await db.weeklyPlan.create({ data: { ...base, version: 2 } });
  });

  it("keeps the audit log immutable", async () => {
    await setup();
    const log = await db.auditLog.findFirstOrThrow();
    await expect(db.auditLog.update({ where: { id: log.id }, data: { action: "TAMPER" } })).rejects.toThrow(/immutable/);
  });

  it("requires completedAt on completed tasks", async () => {
    const { household, users } = await setup();
    await expect(
      db.task.create({ data: { householdId: household.id, title: "x", createdById: users[0].id, status: "COMPLETED" } }),
    ).rejects.toThrow();
  });
});
