import { describe, expect, it } from "vitest";
import { fromPence, lineTotal, splitAmount, SplitError, toPence } from "@/lib/money";

describe("money", () => {
  it("computes product line totals from the brief", () => {
    expect(lineTotal("5", "2").toFixed(2)).toBe("10.00"); // Rice 5 kg × £2
    expect(lineTotal("2", "2").toFixed(2)).toBe("4.00"); // Oil 2 L × £2
    expect(lineTotal("0.333", "1.50").toFixed(2)).toBe("0.50"); // half-up rounding
  });
  it("converts pence without float drift", () => {
    expect(toPence("0.1") + toPence("0.2")).toBe(30);
    expect(fromPence(1999).toFixed(2)).toBe("19.99");
  });
});

describe("splitAmount", () => {
  it("splits equally and distributes remainder pennies so the sum is exact", () => {
    const s = splitAmount(1000, { method: "EQUAL", participants: ["c", "a", "b"] });
    expect(s).toEqual({ a: 334, b: 333, c: 333 });
    expect(Object.values(s).reduce((x, y) => x + y)).toBe(1000);
  });
  it("supports one payer entirely", () => {
    expect(splitAmount(1234, { method: "SINGLE_PAYER", payerId: "a" })).toEqual({ a: 1234 });
  });
  it("validates custom amounts sum to total", () => {
    expect(splitAmount(1000, { method: "CUSTOM_AMOUNT", amounts: { a: 700, b: 300 } })).toEqual({ a: 700, b: 300 });
    expect(() => splitAmount(1000, { method: "CUSTOM_AMOUNT", amounts: { a: 700, b: 200 } })).toThrow(SplitError);
  });
  it("splits by percentage with largest-remainder rounding", () => {
    const s = splitAmount(1001, { method: "PERCENTAGE", percentages: { a: 50, b: 25, c: 25 } });
    expect(Object.values(s).reduce((x, y) => x + y)).toBe(1001);
    expect(s.a).toBe(501);
    expect(() => splitAmount(100, { method: "PERCENTAGE", percentages: { a: 50, b: 40 } })).toThrow(/total 100/);
  });
  it("rejects invalid totals", () => {
    expect(() => splitAmount(-1, { method: "SINGLE_PAYER", payerId: "a" })).toThrow(SplitError);
    expect(() => splitAmount(10.5, { method: "SINGLE_PAYER", payerId: "a" })).toThrow(SplitError);
  });
});
