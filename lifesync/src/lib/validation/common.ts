import { z } from "zod";

/** Centralised primitive validators shared by every module (client + server). */
export const id = z.string().min(1).max(64);
export const email = z.string().trim().toLowerCase().pipe(z.email().max(254));
export const personName = z.string().trim().min(1, "Name is required").max(80);
export const shortText = z.string().trim().min(1).max(200);
export const longText = z.string().trim().max(5000);
export const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24-hour)");
export const isoWeekday = z.number().int().min(1).max(7);
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
export const instant = z.coerce.date();
export const minutes = z.number().int().min(0).max(24 * 60);
/** Money as a string or number with at most 2 decimal places, non-negative. */
export const money = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,10}(\.\d{1,2})?$/.test(v), "Enter a valid amount (max 2 decimal places)");
export const quantity = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d{1,9}(\.\d{1,3})?$/.test(v) && Number(v) > 0, "Enter a positive quantity (max 3 decimal places)");
export const currency = z.string().regex(/^[A-Z]{3}$/, "ISO 4217 code, e.g. GBP");

export const password = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128)
  .refine((p) => /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p), "Include upper-case, lower-case and a number");

/** Interval helper: end must be after start. */
export function withInterval<T extends z.ZodObject<{ startAt: typeof instant; endAt: typeof instant }>>(schema: T) {
  return schema.refine((v) => v.endAt > v.startAt, { message: "End must be after start", path: ["endAt"] });
}
