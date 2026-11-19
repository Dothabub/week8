import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { findUsableInvitation } from "@/server/auth/core";
import { Card } from "@/components/ui/card";
import { AcceptInviteForm } from "./accept-form";

export const metadata: Metadata = { title: "Join household", referrer: "no-referrer" };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await findUsableInvitation(prisma, token);
  if (!inv) {
    return (
      <Card className="p-6 text-center">
        <h2 className="text-lg font-semibold">Invitation unavailable</h2>
        <p className="mt-2 text-[13px] text-muted">This link is invalid, has expired or has already been used. Ask your household admin for a new invitation.</p>
        <Link href="/sign-in" className="mt-5 inline-block text-[13px] font-medium text-accent hover:underline">Go to sign in</Link>
      </Card>
    );
  }
  return <AcceptInviteForm token={token} email={inv.email} household={inv.household.name} role={inv.role} />;
}
