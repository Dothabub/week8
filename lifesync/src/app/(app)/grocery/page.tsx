import type { Metadata } from "next";
import { ShoppingBasket } from "lucide-react";
import { ModulePending } from "@/components/ui/module-pending";

export const metadata: Metadata = { title: "Grocery & Stock" };

export default function Page() {
  return (
    <ModulePending
      title="Grocery & Stock"
      description="Stock counter and smart shopping list."
      phase={7}
      icon={<ShoppingBasket className="h-5 w-5" />}
      features={[
        "22 default products (already created in your database)",
        "Stock in / stock out ledger with history",
        "Low-stock alerts add items to the shopping list",
        "Expiry and consumption tracking",
      ]}
    />
  );
}
