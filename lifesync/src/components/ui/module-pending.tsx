import type { ReactNode } from "react";
import { Card } from "./card";
import { EmptyState } from "./empty-state";
import { PageHeader } from "./page-header";
import { Badge } from "./badge";

/** Placeholder for modules scheduled in later phases – clearly labelled, never fake data. */
export function ModulePending({ title, description, phase, icon, features }: { title: string; description: string; phase: number; icon: ReactNode; features: string[] }) {
  return (
    <>
      <PageHeader title={title} description={description} actions={<Badge tone="warning">Not built yet · Phase {phase}</Badge>} />
      <Card>
        <EmptyState
          icon={icon}
          title={`${title} is coming in Phase ${phase}`}
          description="This section isn't implemented yet. It is shown so navigation is complete; no data here is simulated."
        />
        <div className="border-t border-border px-5 py-4">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-wider text-subtle">Planned</p>
          <ul className="grid gap-1.5 text-[13px] text-muted sm:grid-cols-2">
            {features.map((f) => <li key={f} className="flex gap-2"><span className="text-subtle">•</span>{f}</li>)}
          </ul>
        </div>
      </Card>
    </>
  );
}
