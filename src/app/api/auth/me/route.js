import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guard";
import { userPayload } from "@/lib/auth/session";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const store = pruneExpired(await readAuthStore());
  const sessions = store.sessions
    .filter((s) => s.userId === auth.user.id && !s.revokedAt)
    .map((s) => ({
      id: s.id,
      current: s.id === auth.session.id,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
      ip: s.ip,
      userAgent: s.userAgent,
    }));

  return NextResponse.json({
    user: userPayload(auth.user),
    sessions,
  });
}
