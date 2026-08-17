import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  LOCKOUT_MS,
  LOGIN_CHALLENGE_MS,
  MAX_FAILED_ATTEMPTS,
  SESSION_IDLE_MS,
  SESSION_MAX_AGE_MS,
} from "@/lib/auth/constants";
import { randomToken } from "@/lib/auth/crypto";
import { ENV_ADMIN_ID, getEnvAdmin } from "@/lib/auth/envAdmin";
import { publicUser } from "@/lib/auth/password";
import { nowIso, pruneExpired, readAuthStore, updateAuthStore } from "@/lib/auth/store";
import { encodeSessionToken, decodeSessionToken } from "@/lib/auth/token";

function isSecureRequest(request) {
  if (!request) return false;
  const forwarded = request.headers.get("x-forwarded-proto");
  if (forwarded) return forwarded.split(",")[0].trim() === "https";
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

function cookieOptions(request) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureRequest(request),
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

function findUser(store, userId) {
  const user = store.users.find((u) => u.id === userId);
  if (user) return user;
  const envUser = getEnvAdmin();
  if (envUser && userId === ENV_ADMIN_ID) return envUser;
  return null;
}

export { encodeSessionToken, decodeSessionToken } from "@/lib/auth/token";

export async function getSessionFromRequest(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  const data = await decodeSessionToken(token);
  if (!data) return null;

  const store = pruneExpired(await readAuthStore());
  const now = Date.now();

  if (data.legacy) {
    const session = store.sessions.find((s) => s.id === data.sid && !s.revokedAt);
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() <= now) return null;
    if (now - new Date(session.lastSeenAt).getTime() > SESSION_IDLE_MS) return null;
    const user = findUser(store, session.userId);
    if (!user || user.disabled) return null;
    return { session, user };
  }

  if (data.exp <= now) return null;

  const stored = store.sessions.find((s) => s.id === data.sid);
  if (stored?.revokedAt) return null;

  const lastSeenMs = stored
    ? new Date(stored.lastSeenAt).getTime()
    : Number(data.seen || data.exp);
  if (now - lastSeenMs > SESSION_IDLE_MS) return null;

  const user = findUser(store, data.uid);
  if (!user || user.disabled) return null;

  const session = stored || {
    id: data.sid,
    userId: data.uid,
    createdAt: new Date(Math.max(0, data.exp - SESSION_MAX_AGE_MS)).toISOString(),
    lastSeenAt: new Date(data.seen).toISOString(),
    expiresAt: new Date(data.exp).toISOString(),
    ip: "",
    userAgent: "",
  };

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

export async function setSessionCookie(response, session, request) {
  const token = await encodeSessionToken(session);
  response.cookies.set(AUTH_COOKIE, token, cookieOptions(request));
}

export function clearSessionCookie(response, request) {
  response.cookies.set(AUTH_COOKIE, "", { ...cookieOptions(request), maxAge: 0 });
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
