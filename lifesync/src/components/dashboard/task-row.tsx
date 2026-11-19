import { CircleCheck, CircleDashed, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { fmtDayTime, fmtTime } from "@/lib/format";
import type { DashboardTask } from "@/server/services/dashboard";

const CAT_VAR: Record<string, string> = {
  WORK: "--cat-work", UNIVERSITY: "--cat-university", PLACEMENT: "--cat-placement", HOUSEHOLD: "--cat-household", SHOPPING: "--cat-shopping",
  PERSONAL: "--cat-personal", PASTA: "--cat-pasta", FILISHAKE: "--cat-filishake", OTHER: "--cat-other",
};
const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ");

export function TaskRow({ task, tz, urgent, showAssignee, longDate }: { task: DashboardTask; tz: string; urgent?: boolean; showAssignee?: boolean; longDate?: boolean }) {
  const done = task.status === "COMPLETED";
  const when = task.deadlineAt ?? task.startAt;
  return (
    <li className="flex items-center gap-3 py-2.5">
      {done ? <CircleCheck className="h-[18px] w-[18px] shrink-0 text-success" aria-label="Completed" /> : <CircleDashed className="h-[18px] w-[18px] shrink-0 text-subtle" aria-label={label(task.status)} />}
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: `var(${CAT_VAR[task.category]})` }} aria-hidden />
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-[13.5px] font-medium", done ? "text-subtle line-through" : "text-fg")}>{task.title}</div>
        <div className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
          <span>{label(task.category)}</span>
          {showAssignee && <span>· {task.assigneeName ?? "Unassigned"}</span>}
          {when && (
            <span className="inline-flex items-center gap-1">· <Clock className="h-3 w-3" aria-hidden />{task.deadlineAt ? "Due " : ""}{longDate ? fmtDayTime(when, tz) : fmtTime(when, tz)}</span>
          )}
        </div>
      </div>
      {urgent && !done && <Badge tone="warning">Urgent</Badge>}
      {task.status === "POSTPONED" && <Badge>Postponed</Badge>}
      {task.status === "IN_PROGRESS" && <Badge tone="accent">In progress</Badge>}
    </li>
  );
}
