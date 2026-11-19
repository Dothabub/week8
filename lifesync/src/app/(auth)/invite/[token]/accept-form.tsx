"use client";

import { useActionState } from "react";
import { acceptInviteAction } from "@/app/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormMessage, Input } from "@/components/ui/field";

export function AcceptInviteForm({ token, email, household, role }: { token: string; email: string; household: string; role: string }) {
  const [state, action, pending] = useActionState(acceptInviteAction, null);
  return (
    <Card className="p-6 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Join {household}</h2>
        <Badge tone="accent">{role === "ADMIN" ? "Admin" : "Member"}</Badge>
      </div>
      <p className="mt-1 text-[13px] text-muted">You were invited as <span className="font-medium text-fg">{email}</span>. Choose your name and a password.</p>
      <form action={action} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="token" value={token} />
        <Field label="Your name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required maxLength={80} defaultValue={state?.data?.name} autoFocus />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 12 characters with upper-case, lower-case and a number.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        <FormMessage state={state} />
        <Button type="submit" className="w-full" size="lg" loading={pending}>Create account &amp; join</Button>
      </form>
    </Card>
  );
}
