/**
 * End-to-end journey against a running production build.
 * Usage: BASE_URL=http://localhost:3100 INVITE_URL=<admin link> SHOTS=<dir> DATABASE_URL=<e2e db> node tests/e2e/smoke.mjs
 * Requires the pre-installed Playwright + Chromium.
 */
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright"); // pre-installed globally
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const SHOTS = process.env.SHOTS ?? ".";
const PW = "MapleHouse2026!";
const db = new PrismaClient();
const results = [];
async function step(name, fn) {
  try { await fn(); results.push(["PASS", name]); console.log("PASS", name); }
  catch (e) { results.push(["FAIL", name]); console.log("FAIL", name, "\n   ", e.message.split("\n")[0]); }
}

const browser = await chromium.launch();
const desktop = { viewport: { width: 1440, height: 900 } };

async function accept(ctx, link, name) {
  const p = await ctx.newPage();
  await p.goto(link);
  await p.fill("#name", name);
  await p.fill("#password", PW);
  await p.fill("#confirm", PW);
  await p.click("button[type=submit]");
  await p.waitForURL("**/dashboard?welcome=1");
  return p;
}
async function invite(page, email) {
  await page.goto(`${BASE}/settings/members`);
  await page.fill("#invite-email", email);
  console.log("   click at", new Date().toISOString().slice(17, 23));
  await page.getByRole("button", { name: "Create invitation" }).click();
  try {
    await page.locator("[data-testid=invite-link]", { hasText: "/invite/" }).waitFor({ timeout: 10000 });
  } catch (e) {
    await page.screenshot({ path: `${SHOTS}/fail-invite-${email}.png`, fullPage: true });
    console.log("   DEBUG form value:", await page.inputValue("#invite-email").catch(() => "n/a"));
    console.log("   DEBUG main text:", (await page.locator("main").innerText()).replace(/\n+/g, " | ").slice(0, 600));
    throw e;
  }
  return (await page.locator("[data-testid=invite-link]").textContent()).trim();
}

const adminCtx = await browser.newContext(desktop);
adminCtx.on("page", (pg) => {
  pg.on("pageerror", (e) => console.log("   PAGEERROR", e.message));
  pg.on("request", (r) => { if (r.method() === "POST") console.log("   REQ POST", new Date().toISOString().slice(17, 23), r.url().replace(BASE, "")); });
  pg.on("requestfailed", (r) => console.log("   REQFAILED", r.url().replace(BASE, ""), r.failure()?.errorText));
  pg.on("console", (m) => { if (m.type() === "error") console.log("   CONSOLE", m.text()); });
});
let admin, bilalLink, caraLink;

await step("unauthenticated visitor is redirected to sign-in", async () => {
  const p = await adminCtx.newPage();
  await p.goto(`${BASE}/expenses`);
  assert.match(p.url(), /\/sign-in\?next=%2Fexpenses$/);
  await p.screenshot({ path: `${SHOTS}/01-sign-in.png` });
  await p.close();
});

await step("invalid invitation token shows an unavailable message", async () => {
  const p = await adminCtx.newPage();
  await p.goto(`${BASE}/invite/not-a-real-token-xxxxxxxxxxxxxxxxxxxxx`);
  await p.getByText("Invitation unavailable").waitFor();
  await p.close();
});

await step("weak password is rejected on invitation acceptance", async () => {
  const p = await adminCtx.newPage();
  await p.goto(process.env.INVITE_URL);
  await p.fill("#name", "Ayesha Rahman"); await p.fill("#password", "weakpass"); await p.fill("#confirm", "weakpass");
  await p.click("button[type=submit]");
  await p.getByRole("alert").filter({ hasText: /12 characters/ }).waitFor();
  await p.close();
});

await step("admin accepts invitation and lands on dashboard", async () => {
  admin = await accept(adminCtx, process.env.INVITE_URL, "Ayesha Rahman");
  await admin.getByText("Ayesha, here's your day").waitFor();
  assert.equal(await admin.locator("aside nav a").count(), 12);
});

await step("admin invitation link cannot be reused", async () => {
  const ctx = await browser.newContext(desktop);
  const p = await ctx.newPage();
  await p.goto(process.env.INVITE_URL);
  await p.getByText("Invitation unavailable").waitFor();
  await ctx.close();
});

await step("admin invites two members", async () => {
  bilalLink = await invite(admin, "bilal@example.com");
  caraLink = await invite(admin, "cara@example.com");
  assert.match(bilalLink, /\/invite\/[A-Za-z0-9_-]{40,}$/);
  await admin.getByText("All three seats are taken").waitFor();
});

let bilalCtx, caraCtx;
await step("second and third members accept and sign in (3 accounts)", async () => {
  bilalCtx = await browser.newContext(desktop);
  caraCtx = await browser.newContext({ ...desktop, colorScheme: "dark" });
  await accept(bilalCtx, bilalLink, "Bilal Khan");
  await accept(caraCtx, caraLink, "Cara Jones");
  assert.equal(await db.membership.count(), 3);
});

await step("member cannot manage members", async () => {
  const p = await bilalCtx.newPage();
  await p.goto(`${BASE}/settings/members`);
  await p.getByText("Only admins can invite members").waitFor();
  assert.equal(await p.locator("#invite-email").count(), 0);
  assert.equal(await p.getByRole("button", { name: "Permissions" }).count(), 0);
});

await step("wrong password shows a generic error; correct password signs in", async () => {
  const ctx = await browser.newContext(desktop);
  const p = await ctx.newPage();
  await p.goto(`${BASE}/sign-in`);
  await p.fill("#email", "bilal@example.com"); await p.fill("#password", "WrongPassword1");
  await p.click("button[type=submit]");
  await p.getByText("Incorrect e-mail or password.").waitFor();
  await p.fill("#password", PW);
  await p.click("button[type=submit]");
  await p.waitForURL("**/dashboard");
  await ctx.close();
});

await step("admin grants a permission to a member (persisted)", async () => {
  await admin.goto(`${BASE}/settings/members`);
  const bilalRow = admin.locator("li", { hasText: "bilal@example.com" }).first();
  await bilalRow.getByRole("button", { name: "Permissions" }).click();
  await bilalRow.getByLabel("Manage household finances").check();
  await bilalRow.getByText("Permission updated.").waitFor();
  const m = await db.membership.findFirstOrThrow({ where: { user: { email: "bilal@example.com" } } });
  assert.equal(m.permissions.manageHouseholdFinances, true);
});

// Real rows so the dashboard timeline/overlap rendering can be verified.
await step("dashboard renders real timeline rows with overlap + household task", async () => {
  const ay = await db.user.findUniqueOrThrow({ where: { email: "ayesha@example.com" }, include: { membership: true } });
  const bi = await db.user.findUniqueOrThrow({ where: { email: "bilal@example.com" } });
  const hh = ay.membership.householdId;
  const now = new Date();
  const at = (h) => { const d = new Date(now); d.setUTCMinutes(0, 0, 0); d.setUTCHours(d.getUTCHours() + h); return d; };
  const job = await db.job.create({ data: { householdId: hh, userId: ay.id, slot: "JOB1", name: "Café Lumen", workplace: "High Street" } });
  await db.shift.create({ data: { householdId: hh, jobId: job.id, userId: ay.id, startAt: at(-1), endAt: at(3) } });
  await db.task.create({ data: { householdId: hh, title: "Submit essay draft", createdById: ay.id, assigneeId: ay.id, category: "UNIVERSITY", priority: "URGENT", startAt: at(2), estimatedMinutes: 60, date: new Date(now.toISOString().slice(0, 10)) } });
  await db.task.create({ data: { householdId: hh, title: "Kitchen deep clean", createdById: ay.id, assigneeId: bi.id, category: "HOUSEHOLD", isHousehold: true, date: new Date(now.toISOString().slice(0, 10)) } });
  await admin.goto(`${BASE}/dashboard`);
  await admin.getByText("Café Lumen").waitFor();
  await admin.getByText("2 overlapping").waitFor();
  await admin.getByText("Kitchen deep clean").waitFor();
  await admin.getByText("Bilal Khan", { exact: false }).first().waitFor();
  await admin.screenshot({ path: `${SHOTS}/02-dashboard-desktop-light.png`, fullPage: true });
});

await step("theme switch to dark persists across reload", async () => {
  await admin.locator("aside").getByRole("radio", { name: "Dark" }).click();
  await admin.waitForTimeout(600);
  await admin.reload();
  assert.equal(await admin.evaluate(() => document.documentElement.dataset.theme), "dark");
  await admin.screenshot({ path: `${SHOTS}/03-dashboard-desktop-dark.png`, fullPage: true });
});

await step("sidebar collapses and stays collapsed", async () => {
  await admin.getByRole("button", { name: "Collapse sidebar" }).click();
  await admin.reload();
  const w = await admin.locator("aside").evaluate((el) => el.getBoundingClientRect().width);
  assert.equal(Math.round(w), 72);
  await admin.screenshot({ path: `${SHOTS}/04-sidebar-collapsed.png` });
  await admin.getByRole("button", { name: "Expand sidebar" }).click();
});

await step("profile photo upload; served only to authenticated members", async () => {
  // 1×1 PNG
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  await admin.goto(`${BASE}/settings`);
  await admin.setInputFiles("input[name=avatar]", { name: "me.png", mimeType: "image/png", buffer: png });
  await admin.getByRole("button", { name: "Upload" }).click();
  try { await admin.getByText("Profile photo updated.").waitFor({ timeout: 10000 }); }
  catch (e) {
    await admin.screenshot({ path: `${SHOTS}/fail-avatar.png`, fullPage: true });
    console.log("   DEBUG url:", admin.url());
    console.log("   DEBUG main:", (await admin.locator("body").innerText()).replace(/\n+/g, " | ").slice(0, 500));
    throw e;
  }
  const ay = await db.user.findUniqueOrThrow({ where: { email: "ayesha@example.com" } });
  const asMember = await bilalCtx.request.get(`${BASE}/api/avatar/${ay.id}`);
  assert.equal(asMember.status(), 200);
  assert.equal(asMember.headers()["content-type"], "image/png");
  const anon = await (await browser.newContext()).request.get(`${BASE}/api/avatar/${ay.id}`, { maxRedirects: 0 });
  assert.notEqual(anon.status(), 200);
});

await step("non-image upload is rejected by magic-byte check", async () => {
  await admin.setInputFiles("input[name=avatar]", { name: "evil.png", mimeType: "image/png", buffer: Buffer.from("<script>alert(1)</script>") });
  await admin.getByRole("button", { name: "Upload" }).click();
  await admin.getByText("Only JPEG, PNG or WebP images are allowed.").waitFor();
});

await step("mobile: bottom navigation + More sheet, no sidebar", async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/sign-in`);
  await p.fill("#email", "cara@example.com"); await p.fill("#password", PW); await p.click("button[type=submit]");
  await p.waitForURL("**/dashboard");
  assert.equal(await p.locator("aside").isVisible(), false);
  const bottom = p.locator("nav[aria-label='Main navigation']").last();
  assert.equal(await bottom.isVisible(), true);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert.equal(overflow, false, "horizontal overflow on mobile");
  await p.screenshot({ path: `${SHOTS}/05-mobile-dashboard.png`, fullPage: true });
  await bottom.getByRole("button", { name: "More" }).click();
  await p.getByRole("dialog", { name: "More navigation" }).getByRole("link", { name: "Grocery & Stock" }).click();
  await p.waitForURL("**/grocery");
  await p.getByText("Not built yet · Phase 7").waitFor();
  await p.screenshot({ path: `${SHOTS}/06-mobile-placeholder.png` });
  await ctx.close();
});

await step("sign out ends the session server-side", async () => {
  const before = await db.session.count({ where: { user: { email: "ayesha@example.com" } } });
  await admin.goto(`${BASE}/dashboard`);
  await admin.locator("aside").getByRole("button", { name: "Sign out" }).click();
  await admin.waitForURL("**/sign-in");
  const after = await db.session.count({ where: { user: { email: "ayesha@example.com" } } });
  assert.equal(after, before - 1);
  await admin.goto(`${BASE}/dashboard`);
  assert.match(admin.url(), /\/sign-in/);
});

await browser.close();
await db.$disconnect();
const failed = results.filter((r) => r[0] === "FAIL").length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
