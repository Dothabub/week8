import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Expenses" };

export default function Page() {
  return (
    <ModulePending
      title="Expenses"
      description="Food, travel, bills and shared contributions."
      phase={8}
      icon={<Receipt className="h-5 w-5" />}
      features={[
        "Itemised food purchases (qty × unit price)",
        "Travel costs by transport type",
        "Equal, custom, percentage or single-payer splits",
        "Balances and settlements",
      ]}
    />
  );
}
