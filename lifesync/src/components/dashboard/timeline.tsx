import { Briefcase, Building2, GraduationCap, House, ListChecks, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { fmtTime } from "@/lib/format";
import type { TimelineItem, TimelineKind } from "@/server/services/dashboard";

const KIND: Record<TimelineKind, { color: string; icon: typeof Briefcase; label: string }> = {
  WORK: { color: "var(--cat-work)", icon: Briefcase, label: "Work" },
  UNIVERSITY: { color: "var(--cat-university)", icon: GraduationCap, label: "University" },
  PLACEMENT: { color: "var(--cat-placement)", icon: Building2, label: "Placement" },
  TASK: { color: "var(--cat-personal)", icon: ListChecks, label: "Task" },
  HOUSEHOLD: { color: "var(--cat-household)", icon: House, label: "Household" },
};

/** Chronological daily timeline. Overlapping items and urgent tasks are highlighted. */
export function Timeline({ items, tz, now }: { items: TimelineItem[]; tz: string; now: Date }) {
  const nowIdx = items.findIndex((i) => i.start > now);
  return (
    <ol className="relative">
      {items.map((item, idx) => {
        const k = KIND[item.kind];
        const Icon = k.icon;
        const current = item.start <= now && item.end > now;
        const past = item.end <= now;
        return (
          <li key={item.id} className="relative flex gap-3 pb-4 last:pb-0">
            {idx === nowIdx && <NowMarker tz={tz} now={now} />}
            <div className="tabular w-12 shrink-0 pt-2.5 text-right text-[12px] font-medium text-muted">{fmtTime(item.start, tz)}</div>
            <div className="relative flex flex-col items-center">
              <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${k.color} 14%, transparent)`, color: k.color }}>
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              {idx < items.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1 rounded-xl border px-3.5 py-2.5 transition",
                item.overlap ? "border-danger/40 bg-danger-soft/50" : current ? "border-accent/40 bg-accent-soft/50" : "border-border bg-surface",
                past && !current && "opacity-60",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="truncate text-[13.5px] font-medium text-fg">{item.title}</span>
                {item.fixed && <Badge>Fixed</Badge>}
                {current && <Badge tone="accent">Now</Badge>}
                {item.urgent && <Badge tone="warning">Urgent</Badge>}
                {item.overlap && <Badge tone="danger"><TriangleAlert className="h-3 w-3" aria-hidden />Overlap</Badge>}
              </div>
              <div className="mt-0.5 text-[12px] text-muted">
                <span className="tabular">{fmtTime(item.start, tz)}–{fmtTime(item.end, tz)}</span>
                <span> · {k.label}</span>
                {item.subtitle && <span className="capitalize"> · {item.subtitle}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function NowMarker({ tz, now }: { tz: string; now: Date }) {
  return (
    <div className="pointer-events-none absolute -top-2 left-0 right-0 flex items-center gap-2" aria-label={`Current time ${fmtTime(now, tz)}`}>
      <span className="tabular w-12 text-right text-[10px] font-semibold text-danger">{fmtTime(now, tz)}</span>
      <span className="h-px flex-1 bg-danger/60" />
    </div>
  );
}
