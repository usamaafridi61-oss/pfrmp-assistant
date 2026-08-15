import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { jsonError, revokeSession, revokeUserSessions } from "@/lib/auth/session";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";

export async function DELETE(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const all = searchParams.get("all") === "1";

  if (all) {
    await revokeUserSessions(auth.user.id, auth.session.id);
    return NextResponse.json({ ok: true });
  }

  if (!sessionId) return jsonError("Session id is required.");
  const store = pruneExpired(await readAuthStore());
  const session = store.sessions.find((s) => s.id === sessionId && s.userId === auth.user.id);
  if (!session) return jsonError("Session not found.", 404);
  if (session.id === auth.session.id) return jsonError("Use sign out to end this session.");

  await revokeSession(sessionId);
  return NextResponse.json({ ok: true });
}
