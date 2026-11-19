import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Placement" };

export default function Page() {
  return (
    <ModulePending
      title="Placement"
      description="Placement sessions, hours and deadlines."
      phase={6}
      icon={<Building2 className="h-5 w-5" />}
      features={[
        "Organisation, location and sessions",
        "Attendance and hours completed",
        "Weekly and total hours",
        "Conflict prevention with work and university",
      ]}
    />
  );
}
