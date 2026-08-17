import { NextResponse } from "next/server";
import { ROLES, WRITE_ROLES } from "@/lib/auth/constants";
import {
  assertSameOrigin,
  clearSessionCookie,
  getSessionFromRequest,
  jsonError,
  touchSession,
} from "@/lib/auth/session";

export async function requireAuth(request, { write = false, admin = false } = {}) {
  const csrf = assertSameOrigin(request);
  if (csrf) return { error: csrf };

  const auth = await getSessionFromRequest(request);
  if (!auth) {
    const error = jsonError("Sign in required.", 401);
    clearSessionCookie(error, request);
    return { error };
  }

  try {
    await touchSession(auth.session.id);
  } catch {
    // last-seen updates are best-effort; a locked store file must not fail the request
  }

  if (admin && auth.user.role !== ROLES.ADMIN) {
    return { error: jsonError("Administrator access required.", 403) };
  }

  if (write && !WRITE_ROLES.has(auth.user.role)) {
    return { error: jsonError("This account is read-only.", 403) };
  }

  return auth;
}

export function unauthorized(message = "Sign in required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}
