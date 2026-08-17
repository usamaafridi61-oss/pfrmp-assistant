import { NextResponse } from "next/server";
import { assertSameOrigin, clearSessionCookie, getSessionFromRequest, revokeSession } from "@/lib/auth/session";

export async function POST(request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const auth = await getSessionFromRequest(request);
  if (auth) await revokeSession(auth.session.id);

  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, request);
  return response;
}
