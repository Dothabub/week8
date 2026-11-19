import type { Metadata } from "next";
import { CalendarRange } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Weekly Planner" };

export default function Page() {
  return (
    <ModulePending
      title="Weekly Planner"
      description="Enter your weekly routine; LifeSync builds the plan."
      phase={9}
      icon={<CalendarRange className="h-5 w-5" />}
      features={[
        "Weekly routine input (jobs, university, placement, commitments)",
        "Rule-based scheduling engine with travel buffers and rest",
        "Approve, edit or reject each suggestion",
        "Daily To-do lists generated after approval",
      ]}
    />
  );
}
