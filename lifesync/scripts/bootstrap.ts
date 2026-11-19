/**
 * Usage: npm run bootstrap -- --household "Our Home" --admin-email admin@example.com [--currency GBP]
 * Prints a one-time invitation link for the first admin. Run once per deployment.
 */
import { PrismaClient } from "@prisma/client";
import { bootstrapHousehold } from "../src/server/bootstrap";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  const householdName = arg("household");
  const adminEmail = arg("admin-email");
  if (!householdName || !adminEmail) {
    console.error('Usage: npm run bootstrap -- --household "Name" --admin-email you@example.com [--currency GBP]');
    process.exit(1);
  }
  const db = new PrismaClient();
  try {
    const { household, inviteToken } = await bootstrapHousehold(db, { householdName, adminEmail, currency: arg("currency") });
    const base = process.env.APP_URL ?? "http://localhost:3000";
    console.log(`Household "${household.name}" created (${household.id}).`);
    console.log(`Admin invitation (valid 72h, shown once):\n  ${base}/invite/${inviteToken}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
