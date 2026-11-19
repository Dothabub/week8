"use client";

import { useActionState, useState, useTransition } from "react";
import { useHydrated } from "@/lib/use-hydrated";
import { Check, Copy, Shield } from "lucide-react";
import type { Permission } from "@/lib/permissions";
import { inviteMemberAction, revokeInvitationAction, setMemberActiveAction, updatePermissionAction, updateRoleAction } from "@/app/actions/settings";
import type { FormState } from "@/app/actions/form-state";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";

const LABELS: Record<Permission, string> = {
  manageMembers: "Manage members",
  manageSharedSchedules: "Manage shared schedules",
  manageHouseholdFinances: "Manage household finances",
  manageSettings: "Manage app settings",
  manageOwnTasks: "Manage own tasks",
  manageOwnSchedules: "Update own schedules",
  addExpenses: "Add expenses",
  updateAssignedHouseholdTasks: "Update assigned household tasks",
  viewSharedHousehold: "View shared household info",
  manageGroceryStock: "Manage grocery stock",
  approveWeeklyPlan: "Approve weekly plans",
};
const ADMIN_LOCKED: Permission[] = ["manageMembers", "manageSettings"];

export function MemberControls({ membershipId, role, active, isSelf, permissions }: {
  membershipId: string; role: "ADMIN" | "MEMBER"; active: boolean; isSelf: boolean; permissions: Record<Permission, boolean>;
}) {
  const [msg, setMsg] = useState<FormState>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<FormState>) => start(async () => setMsg(await fn()));

  return (
    <div className="mt-3 space-y-3 pl-[52px]">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`role-${membershipId}`}>Role</label>
        <Select id={`role-${membershipId}`} defaultValue={role} disabled={pending} className="h-8 w-auto text-[13px]"
          onChange={(e) => run(() => updateRoleAction(membershipId, e.target.value))}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </Select>
        <Button variant="secondary" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}><Shield className="h-3.5 w-3.5" />Permissions</Button>
        {!isSelf && (
          <Button variant={active ? "ghost" : "secondary"} size="sm" disabled={pending}
            onClick={() => { if (!active || confirm("Deactivate this member? They will be signed out immediately.")) run(() => setMemberActiveAction(membershipId, !active)); }}>
            {active ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>
      {open && (
        <fieldset className="grid gap-2 rounded-xl border border-border bg-surface-2/60 p-3 sm:grid-cols-2" disabled={pending}>
          <legend className="sr-only">Permissions</legend>
          {(Object.keys(LABELS) as Permission[]).map((p) => {
            const locked = role === "ADMIN" && ADMIN_LOCKED.includes(p);
            return (
              <label key={p} className={cn("flex items-center gap-2.5 text-[13px]", locked && "opacity-60")}>
                <input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" defaultChecked={permissions[p]} disabled={locked}
                  onChange={(e) => run(() => updatePermissionAction(membershipId, p, e.target.checked))} />
                {LABELS[p]}{locked && <span className="text-[11px] text-subtle">(always on for admins)</span>}
              </label>
            );
          })}
        </fieldset>
      )}
      <FormMessage state={msg} />
    </div>
  );
}

export function RevokeButton({ invitationId }: { invitationId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<FormState>(null);
  return (
    <div className="flex items-center gap-2">
      {msg?.error && <span className="text-[12px] text-danger">{msg.error}</span>}
      <Button variant="ghost" size="sm" loading={pending} onClick={() => start(async () => setMsg(await revokeInvitationAction(invitationId)))}>Revoke</Button>
    </div>
  );
}

export function InviteForm({ seatsLeft }: { seatsLeft: number }) {
  const [state, action, pending] = useActionState(inviteMemberAction, null);
  const [copied, setCopied] = useState(false);
  const hydrated = useHydrated(); // the one-time link is only shown by the hydrated form
  const link = state?.data?.link;
  return (
    <form action={action} className="space-y-4">
      {seatsLeft > 0 ? (
        <p className="text-[13px] text-muted">{seatsLeft} {seatsLeft === 1 ? "seat" : "seats"} available.</p>
      ) : (
        <EmptyState compact title="All three seats are taken" description="LifeSync is designed for exactly three people. Revoke a pending invitation or deactivate a member to invite someone new." />
      )}
      {seatsLeft > 0 && <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
        <Field label="E-mail" htmlFor="invite-email"><Input id="invite-email" name="email" type="email" required autoComplete="off" /></Field>
        <Field label="Role" htmlFor="invite-role">
          <Select id="invite-role" name="role" defaultValue="MEMBER"><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></Select>
        </Field>
        <Button type="submit" loading={pending} disabled={!hydrated}>Create invitation</Button>
      </div>}
      <FormMessage state={state} />
      {link && (
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 p-2">
          <code className="min-w-0 flex-1 truncate px-2 font-mono text-[12px]" data-testid="invite-link">{link}</code>
          <Button type="button" size="sm" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); }}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}
          </Button>
        </div>
      )}
    </form>
  );
}
