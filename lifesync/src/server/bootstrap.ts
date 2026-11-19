import type { PrismaClient } from "@prisma/client";
import { generateToken, hashToken } from "@/lib/tokens";
import { DEFAULT_GROCERY_PRODUCTS, INVITATION_TTL_HOURS, SYSTEM_ACTIVITY_CATEGORIES } from "./defaults";
import { email as emailSchema, currency as currencySchema } from "@/lib/validation/common";

export interface BootstrapInput {
  householdName: string;
  adminEmail: string;
  currency?: string;
  timezone?: string;
}

/**
 * Creates the single LifeSync household with default data and a one-time ADMIN
 * invitation. No password is created or hard-coded: the admin sets their own
 * password when accepting the invitation. Returns the raw invitation token
 * (shown once; only its hash is stored).
 */
export async function bootstrapHousehold(db: PrismaClient, input: BootstrapInput) {
  const adminEmail = emailSchema.parse(input.adminEmail);
  const currency = currencySchema.parse(input.currency ?? "GBP");
  const name = input.householdName.trim();
  if (!name) throw new Error("Household name is required");

  const token = generateToken();
  const household = await db.$transaction(async (tx) => {
    if ((await tx.household.count()) > 0) {
      throw new Error("A household already exists. LifeSync is a single-household deployment.");
    }
    const h = await tx.household.create({
      data: { name, currency, timezone: input.timezone ?? "Europe/London" },
    });
    await tx.groceryProduct.createMany({
      data: DEFAULT_GROCERY_PRODUCTS.map((p) => ({ ...p, householdId: h.id, isDefault: true })),
    });
    await tx.activityCategory.createMany({
      data: SYSTEM_ACTIVITY_CATEGORIES.map((c) => ({ ...c, householdId: h.id, isSystem: true })),
    });
    await tx.invitation.create({
      data: {
        householdId: h.id,
        email: adminEmail,
        role: "ADMIN",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + INVITATION_TTL_HOURS * 3600_000),
      },
    });
    await tx.auditLog.create({
      data: { householdId: h.id, action: "BOOTSTRAP", entityType: "Household", entityId: h.id, after: { name, currency } },
    });
    return h;
  });

  return { household, inviteToken: token };
}
