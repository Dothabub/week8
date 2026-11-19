import { NextResponse, type NextRequest } from "next/server";

/**
 * Cheap edge check: unauthenticated visitors are sent to sign-in. The session
 * itself (hash lookup, expiry, membership) is fully validated server-side in
 * the (app) layout and in every Server Action.
 */
const PUBLIC = [/^\/sign-in$/, /^\/invite\//, /^\/_next\//, /^\/favicon\.ico$/];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (PUBLIC.some((r) => r.test(pathname))) return NextResponse.next();
  if (!req.cookies.get("ls_session")?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = pathname === "/" || pathname === "/dashboard" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
