import { describe, expect, it } from "vitest";
import { acceptInviteSchema, expenseSchema, shiftTemplateSchema, taskSchema } from "@/lib/validation";

describe("validation", () => {
  it("normalises e-mail and enforces password strength", () => {
    expect(acceptInviteSchema.safeParse({ token: "x".repeat(43), name: "A", password: "short" }).success).toBe(false);
    expect(acceptInviteSchema.safeParse({ token: "x".repeat(43), name: "A", password: "LongEnough123" }).success).toBe(true);
  });
  it("rejects tasks whose deadline precedes start", () => {
    const r = taskSchema.safeParse({ title: "T", startAt: "2026-11-20T10:00:00Z", deadlineAt: "2026-11-20T09:00:00Z" });
    expect(r.success).toBe(false);
  });
  it("validates HH:MM shift templates and allows overnight shifts", () => {
    const base = { jobId: "j1", isoWeekday: 5, validFrom: "2026-11-16" };
    expect(shiftTemplateSchema.safeParse({ ...base, startTime: "22:00", endTime: "06:00" }).success).toBe(true);
    expect(shiftTemplateSchema.safeParse({ ...base, startTime: "25:00", endTime: "06:00" }).success).toBe(false);
    expect(shiftTemplateSchema.safeParse({ ...base, isoWeekday: 8, startTime: "09:00", endTime: "17:00" }).success).toBe(false);
  });
  it("requires items XOR total, and forbids splitting personal expenses", () => {
    const base = { category: "FOOD", description: "Shop", occurredAt: "2026-11-19T12:00:00Z", paidById: "u1" };
    expect(expenseSchema.safeParse({ ...base, scope: "PERSONAL", split: { method: "SINGLE_PAYER" }, totalAmount: "3.00" }).success).toBe(true);
    expect(expenseSchema.safeParse({ ...base, scope: "PERSONAL", split: { method: "SINGLE_PAYER" } }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, scope: "PERSONAL", split: { method: "EQUAL", participants: ["u1", "u2"] }, totalAmount: "3" }).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, scope: "SHARED", split: { method: "SINGLE_PAYER" }, totalAmount: "3.999" }).success).toBe(false);
  });
  it("requires transport type for travel expenses", () => {
    const base = { category: "TRAVEL", description: "Bus", occurredAt: "2026-11-19T12:00:00Z", paidById: "u1", scope: "PERSONAL", split: { method: "SINGLE_PAYER" }, totalAmount: "1.75" };
    expect(expenseSchema.safeParse(base).success).toBe(false);
    expect(expenseSchema.safeParse({ ...base, travel: { transportType: "BUS" } }).success).toBe(true);
  });
});
