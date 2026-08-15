import { NextResponse } from "next/server";
import { ROLES } from "@/lib/auth/constants";
import { hashPassword, randomToken } from "@/lib/auth/crypto";
import { requireAuth } from "@/lib/auth/guard";
import { jsonError } from "@/lib/auth/session";
import { publicUser, validateDisplayName, validatePassword, validateUsername } from "@/lib/auth/password";
import { nowIso, pruneExpired, readAuthStore, updateAuthStore } from "@/lib/auth/store";

const ALLOWED_ROLES = new Set(Object.values(ROLES));

export async function GET(request) {
  const auth = await requireAuth(request, { admin: true });
  if (auth.error) return auth.error;

  try {
    const store = pruneExpired(await readAuthStore());
    return NextResponse.json({
      users: store.users.map(publicUser),
    });
  } catch {
    return jsonError("Could not load users.", 500);
  }
}

export async function POST(request) {
  const auth = await requireAuth(request, { admin: true });
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  const username = String(body.username || "").trim();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  const role = String(body.role || ROLES.VIEWER);

  const usernameError = validateUsername(username);
  if (usernameError) return jsonError(usernameError);
  const nameError = validateDisplayName(displayName);
  if (nameError) return jsonError(nameError);
  const passwordError = validatePassword(password, username);
  if (passwordError) return jsonError(passwordError);
  if (!ALLOWED_ROLES.has(role)) return jsonError("Invalid role.");

  const store = pruneExpired(await readAuthStore());
  if (store.users.some((u) => u.usernameLower === username.toLowerCase())) {
    return jsonError("That username is already taken.");
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    usernameLower: username.toLowerCase(),
    displayName,
    role,
    passwordHash: await hashPassword(password),
    totpEnabled: false,
    totpSecretEnc: null,
    recoveryHashes: [],
    disabled: false,
    createdAt: nowIso(),
    createdBy: auth.user.id,
    lastLoginAt: null,
  };

  await updateAuthStore((current) => {
    pruneExpired(current);
    current.users.push(user);
    current.auditLog.push({
      id: randomToken(12),
      type: "user_created",
      userId: user.id,
      actorId: auth.user.id,
      at: nowIso(),
    });
    return current;
  });

  return NextResponse.json({ user: publicUser(user) }, { status: 201 });
}
