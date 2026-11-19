import type { Role } from "@prisma/client";

/** Fine-grained permissions. Admins can override per member (Membership.permissions). */
export const PERMISSIONS = [
  "manageMembers",
  "manageSharedSchedules",
  "manageHouseholdFinances",
  "manageSettings",
  "manageOwnTasks",
  "manageOwnSchedules",
  "addExpenses",
  "updateAssignedHouseholdTasks",
  "viewSharedHousehold",
  "manageGroceryStock",
  "approveWeeklyPlan",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type PermissionMap = Partial<Record<Permission, boolean>>;

const MEMBER_DEFAULTS: Record<Permission, boolean> = {
  manageMembers: false,
  manageSharedSchedules: false,
  manageHouseholdFinances: false,
  manageSettings: false,
  manageOwnTasks: true,
  manageOwnSchedules: true,
  addExpenses: true,
  updateAssignedHouseholdTasks: true,
  viewSharedHousehold: true,
  manageGroceryStock: true,
  approveWeeklyPlan: true,
};

const ADMIN_DEFAULTS: Record<Permission, boolean> = Object.fromEntries(
  PERMISSIONS.map((p) => [p, true]),
) as Record<Permission, boolean>;

/** Permissions that can never be removed from an admin (prevents lock-out). */
const ADMIN_LOCKED: Permission[] = ["manageMembers", "manageSettings"];

export function resolvePermissions(role: Role, overrides: unknown): Record<Permission, boolean> {
  const base = { ...(role === "ADMIN" ? ADMIN_DEFAULTS : MEMBER_DEFAULTS) };
  if (overrides && typeof overrides === "object" && !Array.isArray(overrides)) {
    for (const [k, v] of Object.entries(overrides as Record<string, unknown>)) {
      if ((PERMISSIONS as readonly string[]).includes(k) && typeof v === "boolean") {
        base[k as Permission] = v;
      }
    }
  }
  if (role === "ADMIN") for (const p of ADMIN_LOCKED) base[p] = true;
  return base;
}

export function can(role: Role, overrides: unknown, permission: Permission): boolean {
  return resolvePermissions(role, overrides)[permission];
}
