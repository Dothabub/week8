import "server-only";
import { Prisma, type TaskCategory, type TaskPriority, type TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { overlappingIds } from "@/lib/time/intervals";
import { addDaysToKey, dayRangeForKey, zonedDayRange, zonedMonthRange } from "@/lib/time/zone";
import type { SessionContext } from "../auth/core";

export type TimelineKind = "WORK" | "UNIVERSITY" | "PLACEMENT" | "TASK" | "HOUSEHOLD";

export interface TimelineItem {
  id: string; kind: TimelineKind; title: string; subtitle?: string;
  start: Date; end: Date; fixed: boolean; overlap: boolean; urgent: boolean;
  category?: TaskCategory;
}

export interface DashboardTask {
  id: string; title: string; status: TaskStatus; priority: TaskPriority; category: TaskCategory;
  deadlineAt: Date | null; startAt: Date | null; date: Date | null; assigneeName: string | null; isHousehold: boolean;
}

export interface Reminder { id: string; kind: "WORK" | "UNIVERSITY" | "PLACEMENT" | "DEADLINE"; title: string; at: Date; detail?: string }

const OPEN: TaskStatus[] = ["NOT_STARTED", "IN_PROGRESS", "POSTPONED"];
const URGENT_WINDOW_MS = 3 * 3600_000;

const taskSelect = {
  id: true, title: true, status: true, priority: true, category: true, deadlineAt: true, startAt: true, date: true, isHousehold: true,
  estimatedMinutes: true, assignee: { select: { name: true } },
} satisfies Prisma.TaskSelect;

function toDashTask(t: Prisma.TaskGetPayload<{ select: typeof taskSelect }>): DashboardTask {
  return { id: t.id, title: t.title, status: t.status, priority: t.priority, category: t.category, deadlineAt: t.deadlineAt, startAt: t.startAt, date: t.date, assigneeName: t.assignee?.name ?? null, isHousehold: t.isHousehold };
}

function isUrgent(t: { priority: TaskPriority; deadlineAt: Date | null; status: TaskStatus }, now: Date) {
  if (!OPEN.includes(t.status)) return false;
  return t.priority === "URGENT" || (!!t.deadlineAt && t.deadlineAt.getTime() - now.getTime() <= URGENT_WINDOW_MS);
}

/**
 * Everything on the home dashboard, computed from real records only. Modules
 * that have no data yet simply return empty arrays (rendered as empty states).
 */
export async function getDashboard(ctx: SessionContext, now = new Date()) {
  const householdId = ctx.membership.householdId;
  const me = ctx.user.id;
  const household = await prisma.household.findUniqueOrThrow({ where: { id: householdId }, select: { timezone: true, currency: true } });
  const tz = household.timezone;
  const today = zonedDayRange(now, tz);
  const todayDate = new Date(`${today.key}T00:00:00Z`); // @db.Date comparison value
  const weekAhead = dayRangeForKey(addDaysToKey(today.key, 7), tz).start;
  const month = zonedMonthRange(now, tz);

  const todayTaskWhere: Prisma.TaskWhereInput = {
    householdId,
    status: { not: "CANCELLED" },
    OR: [{ date: todayDate }, { deadlineAt: { gte: today.start, lt: today.end } }, { startAt: { gte: today.start, lt: today.end } }],
  };

  const [
    myToday, completedToday, overdue, upcoming, householdToday,
    shifts, uniSessions, placementSessions, nextShift, nextUni, nextPlacement, uniDeadlines, placementDeadlines,
    mySpendToday, sharedSpendToday, budget, sharedSpendMonth,
  ] = await Promise.all([
    prisma.task.findMany({ where: { ...todayTaskWhere, assigneeId: me }, select: { ...taskSelect }, orderBy: [{ startAt: "asc" }, { deadlineAt: "asc" }] }),
    prisma.task.count({ where: { householdId, assigneeId: me, status: "COMPLETED", completedAt: { gte: today.start, lt: today.end } } }),
    prisma.task.count({ where: { householdId, assigneeId: me, status: { in: OPEN }, deadlineAt: { lt: now } } }),
    prisma.task.findMany({
      where: { householdId, assigneeId: me, status: { in: OPEN }, OR: [{ deadlineAt: { gte: today.end, lt: weekAhead } }, { startAt: { gte: today.end, lt: weekAhead } }] },
      select: taskSelect, orderBy: [{ deadlineAt: "asc" }, { startAt: "asc" }], take: 6,
    }),
    prisma.task.findMany({ where: { ...todayTaskWhere, isHousehold: true }, select: taskSelect, orderBy: [{ status: "asc" }, { deadlineAt: "asc" }] }),
    prisma.shift.findMany({ where: { userId: me, status: { not: "CANCELLED" }, startAt: { lt: today.end }, endAt: { gt: today.start } }, include: { job: { select: { name: true, workplace: true } } } }),
    prisma.uniSession.findMany({ where: { module: { userId: me }, startAt: { lt: today.end }, endAt: { gt: today.start } }, include: { module: { select: { name: true, code: true } } } }),
    prisma.placementSession.findMany({ where: { placement: { userId: me }, startAt: { lt: today.end }, endAt: { gt: today.start } }, include: { placement: { select: { organisation: true } } } }),
    prisma.shift.findFirst({ where: { userId: me, status: "SCHEDULED", startAt: { gt: now, lt: weekAhead } }, orderBy: { startAt: "asc" }, include: { job: { select: { name: true, workplace: true } } } }),
    prisma.uniSession.findFirst({ where: { module: { userId: me }, startAt: { gt: now, lt: weekAhead } }, orderBy: { startAt: "asc" }, include: { module: { select: { name: true } } } }),
    prisma.placementSession.findFirst({ where: { placement: { userId: me }, startAt: { gt: now, lt: weekAhead } }, orderBy: { startAt: "asc" }, include: { placement: { select: { organisation: true } } } }),
    prisma.uniDeadline.findMany({ where: { module: { userId: me }, completedAt: null, dueAt: { gt: now, lt: weekAhead } }, orderBy: { dueAt: "asc" }, take: 3, include: { module: { select: { name: true } } } }),
    prisma.placementDeadline.findMany({ where: { placement: { userId: me }, completedAt: null, dueAt: { gt: now, lt: weekAhead } }, orderBy: { dueAt: "asc" }, take: 3, include: { placement: { select: { organisation: true } } } }),
    // My spending today = my share of every expense that occurred today.
    prisma.expenseShare.aggregate({ _sum: { amount: true }, where: { userId: me, expense: { householdId, deletedAt: null, occurredAt: { gte: today.start, lt: today.end } } } }),
    prisma.expense.aggregate({ _sum: { totalAmount: true }, where: { householdId, scope: "SHARED", deletedAt: null, occurredAt: { gte: today.start, lt: today.end } } }),
    prisma.budget.findFirst({ where: { householdId, month: new Date(`${month.key}T00:00:00Z`), category: null } }),
    prisma.expense.aggregate({ _sum: { totalAmount: true }, where: { householdId, scope: "SHARED", deletedAt: null, occurredAt: { gte: month.start, lt: month.end } } }),
  ]);

  // ── Timeline (chronological; overlaps highlighted) ─────────────────────
  const raw: Omit<TimelineItem, "overlap">[] = [
    ...shifts.map((s) => ({ id: `shift:${s.id}`, kind: "WORK" as const, title: s.job.name, subtitle: s.job.workplace ?? undefined, start: s.startAt, end: s.endAt, fixed: true, urgent: false })),
    ...uniSessions.map((u) => ({ id: `uni:${u.id}`, kind: "UNIVERSITY" as const, title: u.module.name, subtitle: [u.type.toLowerCase(), u.room].filter(Boolean).join(" · "), start: u.startAt, end: u.endAt, fixed: true, urgent: false })),
    ...placementSessions.map((p) => ({ id: `placement:${p.id}`, kind: "PLACEMENT" as const, title: p.placement.organisation, start: p.startAt, end: p.endAt, fixed: true, urgent: false })),
    ...myToday.filter((t) => t.startAt).map((t) => {
      const start = t.startAt!;
      const end = new Date(start.getTime() + (t.estimatedMinutes ?? 30) * 60_000);
      return { id: `task:${t.id}`, kind: (t.isHousehold ? "HOUSEHOLD" : "TASK") as TimelineKind, title: t.title, start, end, fixed: false, urgent: isUrgent(t, now), category: t.category };
    }),
  ];
  const overlapIds = overlappingIds(raw.map((r) => ({ id: r.id, start: r.start, end: r.end })));
  const timeline: TimelineItem[] = raw.map((r) => ({ ...r, overlap: overlapIds.has(r.id) })).sort((a, b) => a.start.getTime() - b.start.getTime());

  const reminders: Reminder[] = [
    ...(nextShift ? [{ id: `s:${nextShift.id}`, kind: "WORK" as const, title: nextShift.job.name, at: nextShift.startAt, detail: nextShift.job.workplace ?? undefined }] : []),
    ...(nextUni ? [{ id: `u:${nextUni.id}`, kind: "UNIVERSITY" as const, title: nextUni.module.name, at: nextUni.startAt }] : []),
    ...(nextPlacement ? [{ id: `p:${nextPlacement.id}`, kind: "PLACEMENT" as const, title: nextPlacement.placement.organisation, at: nextPlacement.startAt }] : []),
    ...uniDeadlines.map((d) => ({ id: `ud:${d.id}`, kind: "DEADLINE" as const, title: d.title, at: d.dueAt, detail: d.module.name })),
    ...placementDeadlines.map((d) => ({ id: `pd:${d.id}`, kind: "DEADLINE" as const, title: d.title, at: d.dueAt, detail: d.placement.organisation })),
  ].sort((a, b) => a.at.getTime() - b.at.getTime());

  const todayTasks = myToday.map(toDashTask);
  const zero = new Prisma.Decimal(0);
  const monthSpent = sharedSpendMonth._sum.totalAmount ?? zero;

  return {
    tz,
    currency: household.currency,
    todayKey: today.key,
    timeline,
    todayTasks,
    urgentTaskIds: myToday.filter((t) => isUrgent(t, now)).map((t) => t.id),
    stats: {
      total: todayTasks.length,
      completed: completedToday,
      pending: todayTasks.filter((t) => OPEN.includes(t.status)).length,
      overdue,
    },
    upcoming: upcoming.map(toDashTask),
    householdToday: householdToday.map(toDashTask),
    reminders,
    money: {
      mySpendToday: (mySpendToday._sum.amount ?? zero).toFixed(2),
      sharedSpendToday: (sharedSpendToday._sum.totalAmount ?? zero).toFixed(2),
      monthSharedSpent: monthSpent.toFixed(2),
      budget: budget ? budget.amount.toFixed(2) : null,
      budgetRemaining: budget ? budget.amount.minus(monthSpent).toFixed(2) : null,
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
