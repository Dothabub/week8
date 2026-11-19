import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });

/** Truncates every table. Only ever runs against the *_test database (guarded in global-setup). */
export async function wipe() {
  if (!/_test\b/.test(process.env.DATABASE_URL ?? "")) throw new Error("Refusing to wipe a non-test database");
  const tables: { tablename: string }[] = await db.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'`;
  await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(", ")} CASCADE`);
}
