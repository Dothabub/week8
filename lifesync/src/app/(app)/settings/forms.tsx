"use client";

import { useActionState, useRef } from "react";
import { changePasswordAction, updateProfileAction, uploadAvatarAction } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { useHydrated } from "@/lib/use-hydrated";

export function ProfileForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  const hydrated = useHydrated();
  return (
    <form action={action} className="space-y-4">
      <Field label="Display name" htmlFor="name"><Input id="name" name="name" defaultValue={name} required maxLength={80} autoComplete="name" /></Field>
      <FormMessage state={state} />
      <Button type="submit" loading={pending} disabled={!hydrated}>Save</Button>
    </form>
  );
}

export function AvatarForm() {
  const [state, action, pending] = useActionState(uploadAvatarAction, null);
  const hydrated = useHydrated();
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <label className="inline-flex cursor-pointer">
        <span className="sr-only">Choose profile photo</span>
        <input type="file" name="avatar" accept="image/jpeg,image/png,image/webp" className="text-[13px] text-muted file:mr-3 file:h-9 file:rounded-xl file:border file:border-border file:bg-surface file:px-3 file:text-[13px] file:font-medium file:text-fg hover:file:bg-surface-2" />
      </label>
      <div><Button type="submit" variant="secondary" size="sm" loading={pending} disabled={!hydrated}>Upload</Button></div>
      <FormMessage state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  const hydrated = useHydrated();
  return (
    <form action={action} className="space-y-4">
      <Field label="Current password" htmlFor="current"><Input id="current" name="current" type="password" autoComplete="current-password" required /></Field>
      <Field label="New password" htmlFor="next" hint="At least 12 characters with upper-case, lower-case and a number."><Input id="next" name="next" type="password" autoComplete="new-password" required minLength={12} /></Field>
      <Field label="Confirm new password" htmlFor="confirm"><Input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></Field>
      <FormMessage state={state} />
      <Button type="submit" loading={pending} disabled={!hydrated}>Change password</Button>
    </form>
  );
}
