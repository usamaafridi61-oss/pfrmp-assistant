import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  LOCKOUT_MS,
  LOGIN_CHALLENGE_MS,
  MAX_FAILED_ATTEMPTS,
  SESSION_IDLE_MS,
  SESSION_MAX_AGE_MS,
} from "@/lib/auth/constants";
import { randomToken, signValue, verifySignedValue } from "@/lib/auth/crypto";
import { publicUser } from "@/lib/auth/password";
import { nowIso, pruneExpired, readAuthStore, updateAuthStore } from "@/lib/auth/store";

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_MAX_AGE_MS / 1000),
  };
}

export function clientMeta(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = (forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip")) || "local";
  return {
    ip: ip.trim(),
    userAgent: request.headers.get("user-agent") || "",
  };
}

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const sessionId = await verifySignedValue(token);
  if (!sessionId) return null;

  const store = pruneExpired(await readAuthStore());
  const session = store.sessions.find((s) => s.id === sessionId && !s.revokedAt);
  if (!session) return null;

  const now = Date.now();
  if (new Date(session.expiresAt).getTime() <= now) return null;
  if (now - new Date(session.lastSeenAt).getTime() > SESSION_IDLE_MS) return null;

  const user = store.users.find((u) => u.id === session.userId);
  if (!user || user.disabled) return null;

  return { session, user };
}

const TOUCH_THROTTLE_MS = 30_000;

export async function touchSession(sessionId) {
  const store = pruneExpired(await readAuthStore());
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  if (Date.now() - new Date(session.lastSeenAt).getTime() < TOUCH_THROTTLE_MS) return;

  const now = nowIso();
  await updateAuthStore((current) => {
    pruneExpired(current);
    const next = current.sessions.find((s) => s.id === sessionId);
    if (next) next.lastSeenAt = now;
    return current;
  });
}

export async function createSession(userId, request) {
  const meta = clientMeta(request);
  const now = Date.now();
  const session = {
    id: randomToken(32),
    userId,
    createdAt: new Date(now).toISOString(),
    lastSeenAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_MAX_AGE_MS).toISOString(),
    ip: meta.ip,
    userAgent: meta.userAgent,
  };

  await updateAuthStore((store) => {
    pruneExpired(store);
    store.sessions.push(session);
    const user = store.users.find((u) => u.id === userId);
    if (user) user.lastLoginAt = session.createdAt;
    store.auditLog.push({
      id: randomToken(12),
      type: "login",
      userId,
      at: session.createdAt,
      ip: meta.ip,
    });
    return store;
  });

  return session;
}

export async function revokeSession(sessionId) {
  await updateAuthStore((store) => {
    const session = store.sessions.find((s) => s.id === sessionId);
    if (session) session.revokedAt = nowIso();
    return store;
  });
}

export async function revokeUserSessions(userId, exceptId = null) {
  await updateAuthStore((store) => {
    const at = nowIso();
    for (const session of store.sessions) {
      if (session.userId === userId && session.id !== exceptId && !session.revokedAt) {
        session.revokedAt = at;
      }
    }
    return store;
  });
}

export async function setSessionCookie(response, sessionId) {
  const token = await signValue(sessionId);
  response.cookies.set(AUTH_COOKIE, token, cookieOptions());
}

export function clearSessionCookie(response) {
  response.cookies.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}

export async function createLoginChallenge(userId) {
  const challenge = {
    id: randomToken(24),
    userId,
    expiresAt: new Date(Date.now() + LOGIN_CHALLENGE_MS).toISOString(),
  };
  await updateAuthStore((store) => {
    pruneExpired(store);
    store.challenges.push(challenge);
    return store;
  });
  return challenge;
}

export async function consumeLoginChallenge(challengeId) {
  let found = null;
  await updateAuthStore((store) => {
    pruneExpired(store);
    const idx = store.challenges.findIndex((c) => c.id === challengeId);
    if (idx >= 0) {
      found = store.challenges[idx];
      store.challenges.splice(idx, 1);
    }
    return store;
  });
  return found;
}

export async function recordFailedLogin(username, request) {
  const meta = clientMeta(request);
  await updateAuthStore((store) => {
    pruneExpired(store);
    store.loginAttempts.push({
      username: String(username || "").toLowerCase(),
      ip: meta.ip,
      at: nowIso(),
    });
    store.auditLog.push({
      id: randomToken(12),
      type: "login_failed",
      username: String(username || ""),
      at: nowIso(),
      ip: meta.ip,
    });
    return store;
  });
}

export async function isLockedOut(username, request) {
  const meta = clientMeta(request);
  const store = pruneExpired(await readAuthStore());
  const since = Date.now() - LOCKOUT_MS;
  const key = String(username || "").toLowerCase();
  const failures = store.loginAttempts.filter(
    (a) => a.username === key && a.ip === meta.ip && new Date(a.at).getTime() >= since
  );
  if (failures.length < MAX_FAILED_ATTEMPTS) return null;
  const oldest = Math.min(...failures.map((a) => new Date(a.at).getTime()));
  const remainingMs = LOCKOUT_MS - (Date.now() - oldest);
  return remainingMs > 0 ? remainingMs : null;
}

export async function clearFailures(username, request) {
  const meta = clientMeta(request);
  const key = String(username || "").toLowerCase();
  await updateAuthStore((store) => {
    store.loginAttempts = store.loginAttempts.filter(
      (a) => !(a.username === key && a.ip === meta.ip)
    );
    return store;
  });
}

export function jsonError(message, status = 400, extra = {}) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function userPayload(user) {
  return publicUser(user);
}

export function assertSameOrigin(request) {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") {
    return null;
  }
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const expected = new URL(request.url).origin;
  if (origin !== expected) {
    return jsonError("Invalid request origin.", 403);
  }
  return null;
}
