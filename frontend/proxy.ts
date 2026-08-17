import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection, running before a page renders.
 *
 * Named proxy.ts rather than middleware.ts: the middleware convention was
 * deprecated in Next.js 16 and renamed, though the behaviour is unchanged.
 *
 * This is a first gate, not the security boundary. It only checks whether a
 * session cookie exists — it cannot verify the session or read roles, because
 * that would need an API call on every request. Every admin endpoint enforces
 * its own permissions server-side, so a forged cookie gets a page shell and
 * then 403s on the data it tries to load.
 */

/** Signed-in users only. */
const PROTECTED_PREFIXES = [
  "/admin",
  "/dashboard",
  "/employer-dashboard",
  "/employer",
  "/author-dashboard",
];

/** Pointless once signed in — redirect to the right dashboard instead. */
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];

/**
 * Laravel's session cookie. Derived from APP_NAME via Str::slug, which uses
 * hyphens — "Energy Tail" becomes "energy-tail-session". Renaming the app in
 * .env changes this, so SESSION_COOKIE is pinned explicitly on the server.
 */
const SESSION_COOKIE = "energy-tail-session";

function hasSession(request: NextRequest): boolean {
  return (
    request.cookies.has(SESSION_COOKIE) ||
    request.cookies.has("laravel_session") ||
    // Present whenever a Sanctum session has been established.
    request.cookies.has("XSRF-TOKEN")
  );
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const signedIn = hasSession(request);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !signedIn) {
    const login = new URL("/login", request.url);
    // Return the user where they were headed once they sign in.
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (signedIn && GUEST_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Excludes static assets and image optimisation. Without this the matcher
   * runs on every CSS, JS and image request too, and a redirect would stop
   * those loading rather than just guarding pages.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
