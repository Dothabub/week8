import { z } from "zod";
import * as c from "./common";

export * as primitives from "./common";

export const STOCK_UNITS = ["KG", "GRAM", "LITRE", "ML", "PACKET", "PIECE", "DOZEN"] as const;
export const TASK_CATEGORIES = ["WORK", "UNIVERSITY", "PLACEMENT", "HOUSEHOLD", "SHOPPING", "PERSONAL", "PASTA", "FILISHAKE", "OTHER"] as const;
export const TASK_STATUSES = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "POSTPONED", "CANCELLED"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

// ── Identity ────────────────────────────────────────────────────────────────
export const signInSchema = z.object({ email: c.email, password: z.string().min(1).max(128) });
export const inviteSchema = z.object({ email: c.email, role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER") });
export const acceptInviteSchema = z.object({ token: z.string().min(20).max(200), name: c.personName, password: c.password });

// ── Tasks ───────────────────────────────────────────────────────────────────
export const taskSchema = z
  .object({
    title: c.shortText,
    description: c.longText.optional(),
    assigneeId: c.id.nullable().optional(),
    category: z.enum(TASK_CATEGORIES).default("PERSONAL"),
    activityCategoryId: c.id.nullable().optional(),
    priority: z.enum(TASK_PRIORITIES).default("MEDIUM"),
    isHousehold: z.boolean().default(false),
    date: c.isoDate.optional(),
    startAt: c.instant.optional(),
    deadlineAt: c.instant.optional(),
    estimatedMinutes: z.number().int().min(1).max(24 * 60).optional(),
    reminderAt: c.instant.optional(),
  })
  .refine((t) => !t.startAt || !t.deadlineAt || t.deadlineAt >= t.startAt, { message: "Deadline must be after start", path: ["deadlineAt"] });

// ── Recurring weekly templates (jobs / university / placement) ─────────────
export const weeklySlotSchema = z.object({
  isoWeekday: c.isoWeekday,
  startTime: c.hhmm,
  endTime: c.hhmm,
  validFrom: c.isoDate,
  validUntil: c.isoDate.optional(),
});

export const shiftTemplateSchema = weeklySlotSchema
  .extend({ jobId: c.id, breakMinutes: c.minutes.default(0) })
  .refine((s) => s.startTime !== s.endTime, { message: "Start and end cannot be equal", path: ["endTime"] });

export const uniSessionTemplateSchema = weeklySlotSchema
  .extend({
    moduleId: c.id,
    type: z.enum(["LECTURE", "SEMINAR", "TUTORIAL", "LAB", "OTHER"]),
    location: z.string().trim().max(200).optional(),
    room: z.string().trim().max(50).optional(),
    lecturerNotes: c.longText.optional(),
    travelMinutes: c.minutes.default(30),
  })
  .refine((s) => s.startTime < s.endTime, { message: "End must be after start", path: ["endTime"] });

// ── Grocery & stock ────────────────────────────────────────────────────────
export const groceryProductSchema = z.object({
  name: c.shortText,
  category: z.string().trim().min(1).max(60).default("General"),
  unit: z.enum(STOCK_UNITS),
  minimumStock: c.quantity.or(z.literal("0")).default("0"),
  preferredQuantity: c.quantity.optional(),
});

export const stockTransactionSchema = z.object({
  productId: c.id,
  type: z.enum(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT", "WASTE", "EXPIRED"]),
  quantity: c.quantity,
  /** Only for ADJUSTMENT: direction of the correction. */
  direction: z.enum(["UP", "DOWN"]).optional(),
  unitPrice: c.money.optional(),
  expiryDate: c.isoDate.optional(),
  note: z.string().trim().max(500).optional(),
});

// ── Expenses & splitting ───────────────────────────────────────────────────
export const expenseItemSchema = z.object({
  productId: c.id.optional(),
  name: c.shortText,
  quantity: c.quantity,
  unit: z.enum(STOCK_UNITS).optional(),
  unitPrice: c.money,
  addToStock: z.boolean().default(false),
});

export const splitSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("SINGLE_PAYER") }),
  z.object({ method: z.literal("EQUAL"), participants: z.array(c.id).min(1).max(3) }),
  z.object({ method: z.literal("CUSTOM_AMOUNT"), amounts: z.record(c.id, c.money) }),
  z.object({ method: z.literal("PERCENTAGE"), percentages: z.record(c.id, z.number().min(0).max(100)) }),
]);

export const expenseSchema = z.object({
  category: z.enum(["FOOD", "GROCERY", "RENT", "BILL", "TRAVEL", "ACTIVITY", "OTHER"]),
  description: c.shortText,
  occurredAt: c.instant,
  paidById: c.id,
  scope: z.enum(["PERSONAL", "SHARED"]),
  split: splitSchema,
  /** Either itemised lines (total computed) or a single total amount. */
  items: z.array(expenseItemSchema).max(200).optional(),
  totalAmount: c.money.optional(),
  travel: z
    .object({
      transportType: z.enum(["BUS", "TRAIN", "UNDERGROUND", "TAXI", "FUEL", "PARKING", "OTHER"]),
      fromPlace: z.string().trim().max(120).optional(),
      toPlace: z.string().trim().max(120).optional(),
      purpose: z.string().trim().max(200).optional(),
    })
    .optional(),
}).refine((e) => Boolean(e.items && e.items.length > 0) !== (e.totalAmount !== undefined), {
  message: "Provide either item lines or a total amount, not both",
  path: ["totalAmount"],
}).refine((e) => e.scope === "SHARED" || e.split.method === "SINGLE_PAYER", {
  message: "Personal expenses cannot be split",
  path: ["split"],
}).refine((e) => e.category !== "TRAVEL" || e.travel !== undefined, {
  message: "Travel expenses need a transport type",
  path: ["travel"],
});

export type TaskInput = z.infer<typeof taskSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type StockTransactionInput = z.infer<typeof stockTransactionSchema>;
