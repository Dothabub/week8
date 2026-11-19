import { execSync } from "node:child_process";

/** Integration tests run against a dedicated database (never the dev/prod DB). */
export default function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgresql://lifesync:lifesync_dev@localhost:5432/lifesync_test?schema=public";
  if (!/_test\b/.test(url)) throw new Error("TEST_DATABASE_URL must point at a *_test database");
  process.env.DATABASE_URL = url;
  execSync("npx prisma migrate deploy", { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } });
}
