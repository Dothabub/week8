/**
 * Timezone helpers built on Intl (no extra dependency). All instants are UTC
 * Date objects; "wall clock" values are interpreted in an IANA timezone such as
 * Europe/London, correctly across BST/GMT transitions.
 */

export interface WallClock { year: number; month: number; day: number; hour: number; minute: number; second?: number }

const fmtCache = new Map<string, Intl.DateTimeFormat>();
function formatter(tz: string) {
  let f = fmtCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short",
    });
    fmtCache.set(tz, f);
  }
  return f;
}

const WEEKDAYS: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

/** Wall-clock parts of an instant in a timezone. */
export function toZoned(instant: Date, tz: string): Required<WallClock> & { isoWeekday: number } {
  const parts = Object.fromEntries(formatter(tz).formatToParts(instant).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
    isoWeekday: WEEKDAYS[parts.weekday],
  };
}

/** Offset (ms) of tz from UTC at the given instant. */
function offsetAt(instant: Date, tz: string): number {
  const z = toZoned(instant, tz);
  const asUtc = Date.UTC(z.year, z.month - 1, z.day, z.hour, z.minute, z.second);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Converts a wall-clock time in tz to a UTC instant. Non-existent times (spring
 * forward gap) resolve forward; ambiguous times (autumn fall-back) take the first
 * (earlier) occurrence.
 */
export function fromZoned(w: WallClock, tz: string): Date {
  const naive = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second ?? 0);
  const candidates = [offsetAt(new Date(naive - 86400_000 / 2), tz), offsetAt(new Date(naive + 86400_000 / 2), tz)];
  const results = [...new Set(candidates)]
    .map((off) => naive - off)
    .filter((t) => {
      const z = toZoned(new Date(t), tz);
      return z.year === w.year && z.month === w.month && z.day === w.day && z.hour === w.hour && z.minute === w.minute;
    })
    .sort((a, b) => a - b);
  if (results.length > 0) return new Date(results[0]);
  // In a DST gap: use the pre-transition offset, which lands after the gap.
  return new Date(naive - Math.min(...candidates));
}

export function parseHHMM(s: string): { hour: number; minute: number } {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) throw new Error(`Invalid time "${s}"`);
  return { hour: Number(m[1]), minute: Number(m[2]) };
}

/** "YYYY-MM-DD" of an instant in tz. */
export function zonedDateKey(instant: Date, tz: string): string {
  const z = toZoned(instant, tz);
  return `${z.year}-${String(z.month).padStart(2, "0")}-${String(z.day).padStart(2, "0")}`;
}

export function parseDateKey(key: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`Invalid date "${key}"`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Adds calendar days to a date key (timezone-independent). */
export function addDaysToKey(key: string, days: number): string {
  const { year, month, day } = parseDateKey(key);
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return d.toISOString().slice(0, 10);
}

/** UTC [start, end) of the local calendar day containing `instant` (23/25 h on DST days). */
export function zonedDayRange(instant: Date, tz: string): { start: Date; end: Date; key: string } {
  const key = zonedDateKey(instant, tz);
  return { key, ...dayRangeForKey(key, tz) };
}

export function dayRangeForKey(key: string, tz: string): { start: Date; end: Date } {
  const d = parseDateKey(key);
  const n = parseDateKey(addDaysToKey(key, 1));
  return { start: fromZoned({ ...d, hour: 0, minute: 0 }, tz), end: fromZoned({ ...n, hour: 0, minute: 0 }, tz) };
}

/** Date key of the Monday (or given ISO weekday) starting the week containing `key`. */
export function weekStartKey(key: string, weekStartsOn = 1): string {
  const { year, month, day } = parseDateKey(key);
  const js = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun
  const iso = js === 0 ? 7 : js;
  return addDaysToKey(key, -((iso - weekStartsOn + 7) % 7));
}

/** UTC [start, end) of the local calendar month containing `instant`. */
export function zonedMonthRange(instant: Date, tz: string): { start: Date; end: Date; key: string } {
  const z = toZoned(instant, tz);
  const ny = z.month === 12 ? z.year + 1 : z.year;
  const nm = z.month === 12 ? 1 : z.month + 1;
  return {
    key: `${z.year}-${String(z.month).padStart(2, "0")}-01`,
    start: fromZoned({ year: z.year, month: z.month, day: 1, hour: 0, minute: 0 }, tz),
    end: fromZoned({ year: ny, month: nm, day: 1, hour: 0, minute: 0 }, tz),
  };
}
