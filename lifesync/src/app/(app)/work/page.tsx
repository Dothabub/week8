import type { Metadata } from "next";
import { Briefcase } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Work Schedule" };

export default function Page() {
  return (
    <ModulePending
      title="Work Schedule"
      description="Job 1 and Job 2 shifts."
      phase={6}
      icon={<Briefcase className="h-5 w-5" />}
      features={[
        "Enable only the jobs you have",
        "Recurring weekly shifts and breaks",
        "Expected vs actual earnings",
        "Overlap, travel-time and university/placement conflict detection",
      ]}
    />
  );
}
