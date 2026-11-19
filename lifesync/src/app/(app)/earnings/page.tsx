import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Earnings" };

export default function Page() {
  return (
    <ModulePending
      title="Earnings"
      description="Personal income — private unless you share it."
      phase={8}
      icon={<Wallet className="h-5 w-5" />}
      features={[
        "Job 1, Job 2, placement and other income",
        "Expected vs received payments",
        "Weekly and monthly income",
        "Opt-in combined household view",
      ]}
    />
  );
}
