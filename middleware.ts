import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken, reviewerRoles } from "@/lib/auth";

export const runtime = "nodejs";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedPath = path.startsWith("/admin") || path.startsWith("/reviewer");

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);

  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/admin") && session.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (path.startsWith("/reviewer") && !reviewerRoles.includes(session.role)) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
