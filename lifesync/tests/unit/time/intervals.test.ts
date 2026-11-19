import { describe, expect, it } from "vitest";
import { findOverlaps, freeSlots, overlappingIds } from "@/lib/time/intervals";

const t = (h: number, m = 0) => new Date(Date.UTC(2026, 10, 20, h, m));
const iv = (id: string, a: number, b: number) => ({ id, start: t(a), end: t(b) });

describe("intervals", () => {
  it("detects overlaps but not touching intervals", () => {
    const items = [iv("shift", 9, 17), iv("lecture", 16, 18), iv("gym", 18, 19), iv("study", 20, 21)];
    expect(findOverlaps(items).map(([a, b]) => `${a.id}/${b.id}`)).toEqual(["shift/lecture"]);
    expect([...overlappingIds(items)].sort()).toEqual(["lecture", "shift"]);
  });
  it("detects triple overlap", () => {
    expect(findOverlaps([iv("a", 9, 12), iv("b", 10, 11), iv("c", 10, 13)])).toHaveLength(3);
  });
  it("computes free slots with a minimum length", () => {
    const free = freeSlots({ start: t(7), end: t(22) }, [iv("x", 9, 12), iv("y", 11, 13), { id: "z", start: t(13), end: t(13, 30) }], 60);
    expect(free.map((f) => [f.start.toISOString().slice(11, 16), f.end.toISOString().slice(11, 16)])).toEqual([["07:00", "09:00"], ["13:30", "22:00"]]);
  });
});
