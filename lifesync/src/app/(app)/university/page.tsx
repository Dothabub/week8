import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "University" };

export default function Page() {
  return (
    <ModulePending
      title="University"
      description="Timetable, assignments and exams."
      phase={6}
      icon={<GraduationCap className="h-5 w-5" />}
      features={[
        "Lectures, seminars and tutorials with rooms",
        "Recurring weekly timetable",
        "Assignment deadlines and exam dates",
        "Reminders before classes and deadlines",
      ]}
    />
  );
}
