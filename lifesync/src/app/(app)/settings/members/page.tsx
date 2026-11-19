import type { Metadata } from "next";
import { Mail, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { resolvePermissions } from "@/lib/permissions";
import { requireSession } from "@/server/auth/session";
import { MAX_MEMBERS } from "@/server/auth/core";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { InviteForm, MemberControls, RevokeButton } from "./member-controls";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage() {
  const ctx = await requireSession();
  const isManager = ctx.permissions.manageMembers;
  const householdId = ctx.membership.householdId;
  const [members, invites] = await Promise.all([
    prisma.membership.findMany({
      where: { householdId },
      orderBy: { seat: "asc" },
      include: { user: { select: { id: true, name: true, email: true, lastLoginAt: true, avatar: { select: { updatedAt: true } } } } },
    }),
    isManager
      ? prisma.invitation.findMany({ where: { householdId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
  ]);
  const activeCount = members.filter((m) => m.active).length;
  const seatsLeft = MAX_MEMBERS - activeCount - invites.length;
  const fmt = (d: Date) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(d);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={<Users className="h-4 w-4" />} title="Household members" description={`${activeCount} of ${MAX_MEMBERS} seats used`} />
        <CardBody className="pt-2">
          <ul className="divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} userId={m.user.id} hasImage={!!m.user.avatar} version={m.user.avatar?.updatedAt.getTime().toString(36)} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium">{m.user.name}</span>
                      <Badge tone={m.role === "ADMIN" ? "accent" : "neutral"}>{m.role === "ADMIN" ? "Admin" : "Member"}</Badge>
                      {!m.active && <Badge tone="danger">Deactivated</Badge>}
                      {m.user.id === ctx.user.id && <Badge>You</Badge>}
                    </div>
                    <div className="truncate text-[12px] text-muted">{m.user.email}{m.user.lastLoginAt ? ` · last sign-in ${fmt(m.user.lastLoginAt)}` : ""}</div>
                  </div>
                </div>
                {isManager && (
                  <MemberControls
                    membershipId={m.id}
                    role={m.role}
                    active={m.active}
                    isSelf={m.user.id === ctx.user.id}
                    permissions={resolvePermissions(m.role, m.permissions)}
                  />
                )}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {isManager ? (
        <Card>
          <CardHeader icon={<Mail className="h-4 w-4" />} title="Invitations" description="Invitation links are single-use and expire after 72 hours." />
          <CardBody className="space-y-5">
            {invites.length > 0 && (
              <ul className="divide-y divide-border rounded-xl border border-border">
                {invites.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-medium">{i.email}</div>
                      <div className="text-[12px] text-muted">{i.role === "ADMIN" ? "Admin" : "Member"} · expires {fmt(i.expiresAt)}</div>
                    </div>
                    <RevokeButton invitationId={i.id} />
                  </li>
                ))}
              </ul>
            )}
            {/* Always mounted so a freshly created link survives the re-render that fills the last seat. */}
            <InviteForm seatsLeft={seatsLeft} />
          </CardBody>
        </Card>
      ) : (
        <p className="text-[13px] text-muted">Only admins can invite members or change permissions.</p>
      )}
    </div>
  );
}
