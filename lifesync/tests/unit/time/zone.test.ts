import { describe, expect, it } from "vitest";
import { dayRangeForKey, fromZoned, toZoned, weekStartKey, zonedDayRange, zonedMonthRange } from "@/lib/time/zone";

const LDN = "Europe/London";

describe("timezone helpers (Europe/London)", () => {
  it("converts GMT and BST wall-clock times", () => {
    expect(fromZoned({ year: 2026, month: 1, day: 15, hour: 9, minute: 0 }, LDN).toISOString()).toBe("2026-01-15T09:00:00.000Z");
    expect(fromZoned({ year: 2026, month: 7, day: 15, hour: 9, minute: 0 }, LDN).toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });
  it("handles the spring-forward gap and autumn fall-back ambiguity", () => {
    // 29 Mar 2026: 01:00 → 02:00. 01:30 does not exist.
    expect(fromZoned({ year: 2026, month: 3, day: 29, hour: 1, minute: 30 }, LDN).toISOString()).toBe("2026-03-29T01:30:00.000Z");
    // 25 Oct 2026: 01:30 happens twice; take the first (BST).
    expect(fromZoned({ year: 2026, month: 10, day: 25, hour: 1, minute: 30 }, LDN).toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });
  it("computes 23h and 25h days on DST changes", () => {
    const spring = dayRangeForKey("2026-03-29", LDN);
    expect((spring.end.getTime() - spring.start.getTime()) / 3600_000).toBe(23);
    const autumn = dayRangeForKey("2026-10-25", LDN);
    expect((autumn.end.getTime() - autumn.start.getTime()) / 3600_000).toBe(25);
  });
  it("finds the local day for late-evening UTC instants", () => {
    // 23:30 UTC on 30 Jun = 00:30 BST on 1 Jul.
    expect(zonedDayRange(new Date("2026-06-30T23:30:00Z"), LDN).key).toBe("2026-07-01");
    expect(toZoned(new Date("2026-06-30T23:30:00Z"), LDN).isoWeekday).toBe(3);
  });
  it("computes week and month starts", () => {
    expect(weekStartKey("2026-11-19")).toBe("2026-11-16"); // Thu → Mon
    expect(weekStartKey("2026-11-22")).toBe("2026-11-16"); // Sun → Mon
    expect(weekStartKey("2026-11-16")).toBe("2026-11-16");
    expect(zonedMonthRange(new Date("2026-12-15T12:00:00Z"), LDN).end.toISOString()).toBe("2027-01-01T00:00:00.000Z");
  });
});
