import { NextResponse } from "next/server";
import { ROLES } from "@/lib/auth/constants";
import { hashPassword, randomToken } from "@/lib/auth/crypto";
import { requireAuth } from "@/lib/auth/guard";
import { jsonError, revokeUserSessions } from "@/lib/auth/session";
import { publicUser, validatePassword } from "@/lib/auth/password";
import { nowIso, pruneExpired, updateAuthStore } from "@/lib/auth/store";

const ALLOWED_ROLES = new Set(Object.values(ROLES));

export async function PATCH(request, { params }) {
  const auth = await requireAuth(request, { admin: true });
  if (auth.error) return auth.error;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  let updated = null;
  let error = null;

  await updateAuthStore((store) => {
    pruneExpired(store);
    const user = store.users.find((u) => u.id === id);
    if (!user) {
      error = "User not found.";
      return store;
    }

    if (typeof body.disabled === "boolean") {
      if (user.id === auth.user.id && body.disabled) {
        error = "You cannot disable your own account.";
        return store;
      }
      user.disabled = body.disabled;
      if (body.disabled) {
        const at = nowIso();
        for (const session of store.sessions) {
          if (session.userId === user.id && !session.revokedAt) session.revokedAt = at;
        }
      }
    }

    if (body.role) {
      if (!ALLOWED_ROLES.has(body.role)) {
        error = "Invalid role.";
        return store;
      }
      if (user.id === auth.user.id && body.role !== ROLES.ADMIN) {
        error = "You cannot remove your own administrator role.";
        return store;
      }
      user.role = body.role;
    }

    if (body.resetTotp) {
      user.totpEnabled = false;
      user.totpSecretEnc = null;
      user.recoveryHashes = [];
      user.totpEnabledAt = null;
    }

    store.auditLog.push({
      id: randomToken(12),
      type: "user_updated",
      userId: user.id,
      actorId: auth.user.id,
      at: nowIso(),
    });
    updated = user;
    return store;
  });

  if (error) return jsonError(error, error === "User not found." ? 404 : 400);
  if (!updated) return jsonError("User not found.", 404);

  if (body.password) {
    const passwordError = validatePassword(body.password, updated.username);
    if (passwordError) return jsonError(passwordError);
    const nextHash = await hashPassword(body.password);
    await updateAuthStore((store) => {
      const user = store.users.find((u) => u.id === id);
      if (user) user.passwordHash = nextHash;
      return store;
    });
    await revokeUserSessions(id, id === auth.user.id ? auth.session.id : null);
  }

  return NextResponse.json({ user: publicUser(updated) });
}
