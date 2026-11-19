import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/server/auth/session";

/** Serves a member's profile photo to authenticated members of the same household only. */
export async function GET(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const ctx = await getSession();
  if (!ctx) return new NextResponse(null, { status: 401 });
  const { userId } = await params;
  const avatar = await prisma.userAvatar.findFirst({
    where: { userId, user: { membership: { householdId: ctx.membership.householdId } } },
  });
  if (!avatar) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(avatar.data), {
    headers: {
      "Content-Type": avatar.mimeType,
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
