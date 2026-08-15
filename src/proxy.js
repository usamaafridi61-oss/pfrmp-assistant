import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  PUBLIC_API_PREFIXES,
  PUBLIC_PATHS,
} from "@/lib/auth/constants";
import { verifySignedValue } from "@/lib/auth/crypto";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";
import { SESSION_IDLE_MS } from "@/lib/auth/constants";

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

async function hasUsers() {
  const store = pruneExpired(await readAuthStore());
  return store.users.length > 0;
}

async function sessionIsValid(token) {
  const sessionId = await verifySignedValue(token);
  if (!sessionId) return false;
  const store = pruneExpired(await readAuthStore());
  const session = store.sessions.find((s) => s.id === sessionId && !s.revokedAt);
  if (!session) return false;
  const now = Date.now();
  if (new Date(session.expiresAt).getTime() <= now) return false;
  if (now - new Date(session.lastSeenAt).getTime() > SESSION_IDLE_MS) return false;
  const user = store.users.find((u) => u.id === session.userId);
  return Boolean(user && !user.disabled);
}

function withSecurityHeaders(response) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const setupDone = await hasUsers();
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const signedIn = token ? await sessionIsValid(token) : false;

  if (!setupDone && pathname !== "/setup" && !pathname.startsWith("/api/auth/status") && !pathname.startsWith("/api/auth/setup")) {
    if (pathname.startsWith("/api/")) {
      return withSecurityHeaders(NextResponse.json({ error: "Initial administrator setup is required." }, { status: 401 }));
    }
    return withSecurityHeaders(NextResponse.redirect(new URL("/setup", request.url)));
  }

  if (setupDone && pathname === "/setup") {
    return withSecurityHeaders(NextResponse.redirect(new URL(signedIn ? "/" : "/login", request.url)));
  }

  if (isPublicPath(pathname)) {
    if (signedIn && (pathname === "/login" || pathname === "/setup")) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/", request.url)));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  if (pathname === "/api/auth/logout") {
    return withSecurityHeaders(NextResponse.next());
  }

  if (signedIn) return withSecurityHeaders(NextResponse.next());

  if (pathname.startsWith("/api/")) {
    return withSecurityHeaders(NextResponse.json({ error: "Sign in required." }, { status: 401 }));
  }

  const loginUrl = new URL("/login", request.url);
  if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
  return withSecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
