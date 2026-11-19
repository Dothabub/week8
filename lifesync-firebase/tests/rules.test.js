import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, setLogLevel } from "firebase/firestore";

const HID = "h1";
let env;

// Seed data bypasses rules (Admin SDK equivalent) for test setup.
async function seed(fn) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore()));
}

beforeAll(async () => {
  setLogLevel("error");
  env = await initializeTestEnvironment({
    projectId: "lifesync-test",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});
afterAll(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, "households", HID), { name: "Maple House" });
    await setDoc(doc(db, `households/${HID}/members/admin`), { role: "ADMIN", seat: 1, active: true, permissions: {} });
    await setDoc(doc(db, `households/${HID}/members/bilal`), { role: "MEMBER", seat: 2, active: true, permissions: {} });
    await setDoc(doc(db, `households/${HID}/members/cara`), { role: "MEMBER", seat: 3, active: true, permissions: {} });
    await setDoc(doc(db, `households/${HID}/members/inactive`), { role: "MEMBER", seat: 3, active: false, permissions: {} });
    await setDoc(doc(db, `households/${HID}/members/dan`), { role: "MEMBER", seat: 3, active: true, permissions: { addExpenses: false, manageGroceryStock: false } });
    await setDoc(doc(db, "users/admin"), { name: "Ayesha" });
    await setDoc(doc(db, `households/${HID}/personal/bilal/shifts/s1`), { amount: 50 });
  });
});

const as = (uid) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

describe("household membership", () => {
  it("members can read the household member list; outsiders cannot", async () => {
    await assertSucceeds(getDoc(doc(as("bilal"), `households/${HID}/members/admin`)));
    await assertFails(getDoc(doc(as("stranger"), `households/${HID}/members/admin`)));
    await assertFails(getDoc(doc(anon(), `households/${HID}/members/admin`)));
  });
  it("deactivated members lose access", async () => {
    await assertFails(getDoc(doc(as("inactive"), `households/${HID}/members/admin`)));
  });
  it("clients cannot write membership, invitations or households directly", async () => {
    await assertFails(setDoc(doc(as("bilal"), `households/${HID}/members/bilal`), { role: "ADMIN", active: true }));
    await assertFails(setDoc(doc(as("admin"), `households/${HID}/invitations/i1`), { email: "x@example.com" }));
    await assertFails(setDoc(doc(as("admin"), `households/${HID}`), { name: "hacked" }));
  });
  it("only admins read invitations and audit logs", async () => {
    await seed(async (db) => setDoc(doc(db, `households/${HID}/invitations/i1`), { email: "x@example.com" }));
    await assertSucceeds(getDoc(doc(as("admin"), `households/${HID}/invitations/i1`)));
    await assertFails(getDoc(doc(as("bilal"), `households/${HID}/invitations/i1`)));
    await assertFails(getDoc(doc(as("bilal"), `households/${HID}/auditLogs/a1`)));
  });
});

describe("private profile", () => {
  it("users can update only their own name", async () => {
    await assertSucceeds(updateDoc(doc(as("admin"), "users/admin"), { name: "Ayesha R", updatedAt: new Date() }));
    await assertFails(updateDoc(doc(as("bilal"), "users/admin"), { name: "x" }));
    await assertFails(updateDoc(doc(as("admin"), "users/admin"), { name: "x", role: "ADMIN" }));
    await assertFails(updateDoc(doc(as("admin"), "users/admin"), { name: "" }));
  });
});

describe("personal data", () => {
  it("personal records are visible only to their owner", async () => {
    await assertSucceeds(getDoc(doc(as("bilal"), `households/${HID}/personal/bilal/shifts/s1`)));
    await assertFails(getDoc(doc(as("admin"), `households/${HID}/personal/bilal/shifts/s1`)));
    await assertFails(getDoc(doc(as("cara"), `households/${HID}/personal/bilal/shifts/s1`)));
  });
});

describe("tasks", () => {
  it("members create tasks for themselves; cannot forge the creator", async () => {
    await assertSucceeds(addDoc(collection(as("bilal"), `households/${HID}/tasks`), { title: "Buy milk", createdById: "bilal", assigneeId: "bilal", isHousehold: false }));
    await assertFails(addDoc(collection(as("bilal"), `households/${HID}/tasks`), { title: "x", createdById: "admin" }));
  });
  it("household tasks are visible to all members; personal tasks only to assignee/creator", async () => {
    await seed(async (db) => {
      await setDoc(doc(db, `households/${HID}/tasks/hh`), { title: "Clean", createdById: "admin", assigneeId: "bilal", isHousehold: true });
      await setDoc(doc(db, `households/${HID}/tasks/p`), { title: "Private", createdById: "admin", assigneeId: "admin", isHousehold: false });
    });
    await assertSucceeds(getDoc(doc(as("cara"), `households/${HID}/tasks/hh`)));
    await assertFails(getDoc(doc(as("cara"), `households/${HID}/tasks/p`)));
  });
});

describe("expenses and stock", () => {
  it("expense creation needs the addExpenses permission", async () => {
    // Default for members is addExpenses = true (permissions.ts), so cara (no overrides) may add.
    await assertSucceeds(addDoc(collection(as("cara"), `households/${HID}/expenses`), { createdById: "cara", totalAmount: 12.5, deletedAt: null }));
    // dan has an explicit override addExpenses = false, so he is denied.
    await assertFails(addDoc(collection(as("dan"), `households/${HID}/expenses`), { createdById: "dan", totalAmount: 1, deletedAt: null }));
  });
  it("negative totals are rejected", async () => {
    await assertFails(addDoc(collection(as("cara"), `households/${HID}/expenses`), { createdById: "cara", totalAmount: -5, deletedAt: null }));
  });
  it("stock ledger is append-only and respects manageGroceryStock", async () => {
    await assertSucceeds(addDoc(collection(as("bilal"), `households/${HID}/stockTransactions`), { userId: "bilal", quantity: 5, type: "STOCK_IN" }));
    await assertFails(addDoc(collection(as("dan"), `households/${HID}/stockTransactions`), { userId: "dan", quantity: 5, type: "STOCK_IN" }));
    await assertFails(addDoc(collection(as("bilal"), `households/${HID}/stockTransactions`), { userId: "admin", quantity: 5, type: "STOCK_IN" }));
    await assertFails(updateDoc(doc(as("admin"), `households/${HID}/stockTransactions/x`), { quantity: 1 }));
    await assertFails(deleteDoc(doc(as("admin"), `households/${HID}/stockTransactions/x`)));
  });
});

describe("default deny", () => {
  it("unknown collections are denied", async () => {
    await assertFails(getDoc(doc(as("admin"), "secrets/x")));
    await assertFails(setDoc(doc(as("admin"), "random/x"), { a: 1 }));
  });
});
