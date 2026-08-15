import { NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/crypto";
import { requireAuth } from "@/lib/auth/guard";
import { jsonError, revokeUserSessions } from "@/lib/auth/session";
import { validatePassword } from "@/lib/auth/password";
import { nowIso, updateAuthStore } from "@/lib/auth/store";

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  const currentPassword = String(body.currentPassword || "");
  const nextPassword = String(body.nextPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!(await verifyPassword(currentPassword, auth.user.passwordHash))) {
    return jsonError("Current password is incorrect.", 401);
  }

  const passwordError = validatePassword(nextPassword, auth.user.username);
  if (passwordError) return jsonError(passwordError);
  if (nextPassword !== confirmPassword) return jsonError("Passwords do not match.");
  if (await verifyPassword(nextPassword, auth.user.passwordHash)) {
    return jsonError("Choose a different password.");
  }

  const nextHash = await hashPassword(nextPassword);
  await updateAuthStore((store) => {
    const user = store.users.find((u) => u.id === auth.user.id);
    if (user) {
      user.passwordHash = nextHash;
      user.passwordChangedAt = nowIso();
    }
    return store;
  });

  await revokeUserSessions(auth.user.id, auth.session.id);
  return NextResponse.json({ ok: true });
}
