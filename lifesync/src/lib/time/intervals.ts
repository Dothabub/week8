export interface Interval { start: Date; end: Date }
export interface Labeled extends Interval { id: string }

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}

export function durationMinutes(i: Interval): number {
  return Math.round((i.end.getTime() - i.start.getTime()) / 60_000);
}

/** All overlapping pairs (sweep line, O(n log n + k)). Touching intervals do not overlap. */
export function findOverlaps<T extends Labeled>(items: T[]): [T, T][] {
  const sorted = [...items].sort((a, b) => a.start.getTime() - b.start.getTime() || a.end.getTime() - b.end.getTime());
  const out: [T, T][] = [];
  const active: T[] = [];
  for (const item of sorted) {
    for (let i = active.length - 1; i >= 0; i--) if (active[i].end <= item.start) active.splice(i, 1);
    for (const a of active) out.push([a, item]);
    active.push(item);
  }
  return out;
}

/** Ids of every item that overlaps at least one other item. */
export function overlappingIds(items: Labeled[]): Set<string> {
  const ids = new Set<string>();
  for (const [a, b] of findOverlaps(items)) { ids.add(a.id); ids.add(b.id); }
  return ids;
}

/** Subtracts busy intervals from a window and returns free gaps of at least minMinutes. */
export function freeSlots(window: Interval, busy: Interval[], minMinutes = 0): Interval[] {
  const sorted = busy.filter((b) => overlaps(b, window)).sort((a, b) => a.start.getTime() - b.start.getTime());
  const free: Interval[] = [];
  let cursor = window.start;
  for (const b of sorted) {
    if (b.start > cursor) free.push({ start: cursor, end: b.start < window.end ? b.start : window.end });
    if (b.end > cursor) cursor = b.end;
    if (cursor >= window.end) break;
  }
  if (cursor < window.end) free.push({ start: cursor, end: window.end });
  return free.filter((f) => durationMinutes(f) >= minMinutes);
}
