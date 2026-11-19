import type { Metadata } from "next";
import { House } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Household" };

export default function Page() {
  return (
    <ModulePending
      title="Household"
      description="Shared chores, bills and responsibilities."
      phase={7}
      icon={<House className="h-5 w-5" />}
      features={[
        "Cleaning, kitchen and shopping rotas",
        "Who is responsible for each task",
        "Rent and shared bills",
        "Completed vs pending responsibilities",
      ]}
    />
  );
}
