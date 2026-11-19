"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { signInAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, FormMessage, Input } from "@/components/ui/field";

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signInAction, null);
  return (
    <Card className="p-6 sm:p-7">
      <h2 className="text-lg font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-1 text-[13px] text-muted">Sign in to your household.</p>
      <form action={action} className="mt-6 space-y-4" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required defaultValue={state?.data?.email} autoFocus />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        <FormMessage state={state} />
        <Button type="submit" className="w-full" size="lg" loading={pending}>Sign in</Button>
      </form>
      <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-subtle">
        <Lock className="h-3 w-3" aria-hidden /> Invitation-only. Ask your household admin for a link.
      </p>
    </Card>
  );
}
