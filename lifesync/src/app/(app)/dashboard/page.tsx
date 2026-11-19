import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Briefcase, Building2, CalendarClock, CalendarRange, CircleCheck, GraduationCap, House, ListChecks, PoundSterling, TriangleAlert, Wallet } from "lucide-react";
import { requireSession } from "@/server/auth/session";
import { getDashboard, type Reminder } from "@/server/services/dashboard";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/dashboard/live-clock";
import { Timeline } from "@/components/dashboard/timeline";
import { TaskRow } from "@/components/dashboard/task-row";
import { fmtDayTime, fmtMoney, greeting } from "@/lib/format";
import { toZoned } from "@/lib/time/zone";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const REMINDER_ICON: Record<Reminder["kind"], typeof Briefcase> = { WORK: Briefcase, UNIVERSITY: GraduationCap, PLACEMENT: Building2, DEADLINE: CalendarClock };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ welcome?: string; denied?: string }> }) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const now = new Date();
  const d = await getDashboard(ctx, now);
  const firstName = ctx.user.name.split(" ")[0];
  const hour = toZoned(now, d.tz).hour;
  const urgent = new Set(d.urgentTaskIds);
  const overlapCount = d.timeline.filter((t) => t.overlap).length;

  return (
    <div className="space-y-6">
      {sp.denied && (
        <div role="alert" className="rounded-xl bg-warning-soft px-4 py-3 text-[13px] text-warning">You don&apos;t have permission to open that page. Ask your household admin.</div>
      )}
      {sp.welcome && (
        <div role="status" className="rounded-xl bg-success-soft px-4 py-3 text-[13px] text-success">Welcome to LifeSync, {firstName}! Start by adding your weekly routine.</div>
      )}

      <section className="flex flex-col-reverse gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-medium text-subtle">{greeting(hour)}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight sm:text-[30px]">{firstName}, here&apos;s your day</h1>
          <p className="mt-1 text-sm text-muted">
            {d.stats.total === 0 && d.timeline.length === 0
              ? "Nothing scheduled yet for today."
              : `${d.timeline.length} scheduled ${d.timeline.length === 1 ? "item" : "items"} · ${d.stats.pending} pending ${d.stats.pending === 1 ? "task" : "tasks"}`}
          </p>
        </div>
        <LiveClock tz={d.tz} initialIso={now.toISOString()} />
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Today at a glance">
        <Stat icon={<ListChecks className="h-4 w-4" />} label="Pending today" value={d.stats.pending} />
        <Stat icon={<CircleCheck className="h-4 w-4" />} label="Completed today" value={d.stats.completed} tone="success" />
        <Stat icon={<TriangleAlert className="h-4 w-4" />} label="Overdue" value={d.stats.overdue} tone={d.stats.overdue ? "danger" : undefined} />
        <Stat icon={<PoundSterling className="h-4 w-4" />} label="My spending today" value={fmtMoney(d.money.mySpendToday, d.currency)} />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader
              icon={<CalendarRange className="h-4 w-4" />}
              title="Today's timeline"
              description="Fixed commitments and timed tasks in order"
              action={overlapCount > 0 ? <Badge tone="danger"><TriangleAlert className="h-3 w-3" />{overlapCount} overlapping</Badge> : undefined}
            />
            <CardBody>
              {d.timeline.length ? (
                <Timeline items={d.timeline} tz={d.tz} now={now} />
              ) : (
                <EmptyState
                  compact
                  icon={<CalendarRange className="h-5 w-5" />}
                  title="No schedule for today"
                  description="Work shifts, classes, placement sessions and timed tasks will appear here once you add your weekly routine."
                  action={<Link href="/planner" className="text-[13px] font-medium text-accent hover:underline">Set up weekly routine →</Link>}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<ListChecks className="h-4 w-4" />}
              title="Today's tasks"
              description={`${d.stats.completed} completed · ${d.stats.pending} pending`}
              action={<Link href="/tasks" className="text-[13px] font-medium text-accent hover:underline">All tasks</Link>}
            />
            <CardBody className="pt-2">
              {d.todayTasks.length ? (
                <ul className="divide-y divide-border">{d.todayTasks.map((t) => <TaskRow key={t.id} task={t} tz={d.tz} urgent={urgent.has(t.id)} />)}</ul>
              ) : (
                <EmptyState compact icon={<ListChecks className="h-5 w-5" />} title="No tasks for today" description="Tasks assigned to you for today will show here." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<CalendarClock className="h-4 w-4" />} title="Upcoming" description="Next 7 days" />
            <CardBody className="pt-2">
              {d.upcoming.length ? (
                <ul className="divide-y divide-border">{d.upcoming.map((t) => <TaskRow key={t.id} task={t} tz={d.tz} longDate />)}</ul>
              ) : (
                <EmptyState compact title="Nothing coming up" description="Upcoming deadlines and scheduled tasks for the week appear here." />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader icon={<Bell className="h-4 w-4" />} title="Reminders" description="Work, university and placement" />
            <CardBody className="pt-2">
              {d.reminders.length ? (
                <ul className="divide-y divide-border">
                  {d.reminders.map((r) => {
                    const Icon = REMINDER_ICON[r.kind];
                    return (
                      <li key={r.id} className="flex items-center gap-3 py-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-muted"><Icon className="h-4 w-4" aria-hidden /></span>
                        <div className="min-w-0">
                          <div className="truncate text-[13.5px] font-medium">{r.title}</div>
                          <div className="text-[12px] text-muted">{fmtDayTime(r.at, d.tz)}{r.detail ? ` · ${r.detail}` : ""}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState compact icon={<Bell className="h-5 w-5" />} title="No reminders this week" description="Your next shift, class, placement session and deadlines will appear here." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              icon={<House className="h-4 w-4" />}
              title="Household today"
              description="Shared responsibilities"
              action={<Link href="/household" className="text-[13px] font-medium text-accent hover:underline">Open</Link>}
            />
            <CardBody className="pt-2">
              {d.householdToday.length ? (
                <ul className="divide-y divide-border">{d.householdToday.map((t) => <TaskRow key={t.id} task={t} tz={d.tz} showAssignee />)}</ul>
              ) : (
                <EmptyState compact title="No household tasks today" description="Cleaning, kitchen and shopping duties will show who is responsible." />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<Wallet className="h-4 w-4" />} title="Money today" description="Spending and this month's shared budget" />
            <CardBody className="space-y-3">
              <Row label="My spending today" value={fmtMoney(d.money.mySpendToday, d.currency)} />
              <Row label="Shared household spending today" value={fmtMoney(d.money.sharedSpendToday, d.currency)} />
              <Row label="Shared spending this month" value={fmtMoney(d.money.monthSharedSpent, d.currency)} />
              <div className="border-t border-border pt-3">
                {d.money.budget === null ? (
                  <p className="text-[13px] text-muted">No monthly budget set. An admin can add one in Expenses.</p>
                ) : (
                  <Row
                    label="Available budget"
                    value={fmtMoney(d.money.budgetRemaining!, d.currency)}
                    strong
                    tone={Number(d.money.budgetRemaining) < 0 ? "danger" : "success"}
                  />
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: "success" | "danger" }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[12px] font-medium text-muted"><span className="text-subtle">{icon}</span>{label}</div>
      <div className={`tabular mt-2 text-2xl font-semibold tracking-tight ${tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : "text-fg"}`}>{value}</div>
    </Card>
  );
}

function Row({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px]">
      <span className="text-muted">{label}</span>
      <span className={`tabular ${strong ? "text-base font-semibold" : "font-medium"} ${tone === "danger" ? "text-danger" : tone === "success" ? "text-success" : "text-fg"}`}>{value}</span>
    </div>
  );
}
