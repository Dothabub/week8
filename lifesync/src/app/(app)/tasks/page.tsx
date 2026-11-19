import type { Metadata } from "next";
import { ListChecks } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "My Tasks" };

export default function Page() {
  return (
    <ModulePending
      title="My Tasks"
      description="Your personal and assigned tasks."
      phase={5}
      icon={<ListChecks className="h-5 w-5" />}
      features={[
        "Create, edit, delete and repeat tasks",
        "Assign to members, notes and reminders",
        "Statuses: Not Started → Completed / Postponed / Cancelled",
        "Daily, weekly and monthly views",
      ]}
    />
  );
}
