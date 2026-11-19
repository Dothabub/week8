import { describe, expect, it } from "vitest";
import { can, resolvePermissions } from "@/lib/permissions";

describe("permissions", () => {
  it("members manage their own data but not household finances or members", () => {
    expect(can("MEMBER", {}, "manageOwnTasks")).toBe(true);
    expect(can("MEMBER", {}, "addExpenses")).toBe(true);
    expect(can("MEMBER", {}, "manageHouseholdFinances")).toBe(false);
    expect(can("MEMBER", {}, "manageMembers")).toBe(false);
  });
  it("admin can grant a member extra permissions", () => {
    expect(can("MEMBER", { manageHouseholdFinances: true }, "manageHouseholdFinances")).toBe(true);
  });
  it("admins cannot be locked out of member/settings management", () => {
    const p = resolvePermissions("ADMIN", { manageMembers: false, manageSettings: false, manageHouseholdFinances: false });
    expect(p.manageMembers).toBe(true);
    expect(p.manageSettings).toBe(true);
    expect(p.manageHouseholdFinances).toBe(false);
  });
  it("ignores unknown or non-boolean overrides", () => {
    const p = resolvePermissions("MEMBER", { hack: true, manageMembers: "yes" });
    expect(p.manageMembers).toBe(false);
    expect("hack" in p).toBe(false);
  });
});
