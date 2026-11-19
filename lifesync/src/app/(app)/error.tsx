"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Card>
      <EmptyState icon={<TriangleAlert className="h-5 w-5" />} title="Something went wrong" description="The page couldn't load. Your data has not been changed." action={<Button variant="secondary" onClick={reset}>Try again</Button>} />
    </Card>
  );
}
