import type { Metadata } from "next";
import { ChartColumn } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return (
    <ModulePending
      title="Reports"
      description="Exports and trends."
      phase={11}
      icon={<ChartColumn className="h-5 w-5" />}
      features={[
        "Weekly schedule PDF",
        "Monthly expense, grocery, earnings and travel reports",
        "Household contribution report",
        "PDF and CSV export",
      ]}
    />
  );
}
