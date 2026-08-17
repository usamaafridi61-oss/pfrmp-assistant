import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  PUBLIC_API_PREFIXES,
  PUBLIC_PATHS,
} from "@/lib/auth/constants";
import { envAdminConfigured } from "@/lib/auth/envAdmin";
import { decodeSessionToken } from "@/lib/auth/token";
import { hasDatabase } from "@/lib/db-env";

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

let usersCache = { at: 0, value: false };

async function hasUsers() {
  if (envAdminConfigured() || hasDatabase()) return true;
  if (Date.now() - usersCache.at < 4000) return usersCache.value;
  try {
    const raw = await fs.readFile(path.resolve(process.cwd(), "data", "auth-store.json"), "utf8");
    const parsed = JSON.parse(raw);
    usersCache = {
      at: Date.now(),
      value: Array.isArray(parsed?.users) && parsed.users.length > 0,
    };
  } catch {
    usersCache = { at: Date.now(), value: false };
  }
  return usersCache.value;
}

async function sessionIsValid(token) {
  const data = await decodeSessionToken(token);
  if (!data) return false;
  const now = Date.now();
  if (data.legacy) return false;
  if (data.exp <= now) return false;
  return Boolean(data.uid);
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
