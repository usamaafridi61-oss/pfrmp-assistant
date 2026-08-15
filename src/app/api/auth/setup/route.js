import { NextResponse } from "next/server";
import { ROLES } from "@/lib/auth/constants";
import { hashPassword } from "@/lib/auth/crypto";
import { envAdminConfigured } from "@/lib/auth/envAdmin";
import { publicUser, validateDisplayName, validatePassword, validateUsername } from "@/lib/auth/password";
import {
  assertSameOrigin,
  createSession,
  jsonError,
  setSessionCookie,
} from "@/lib/auth/session";
import { nowIso, pruneExpired, readAuthStore, updateAuthStore } from "@/lib/auth/store";

export async function POST(request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  const store = pruneExpired(await readAuthStore());
  if (envAdminConfigured() || store.users.length > 0) {
    return jsonError("Setup has already been completed.", 409);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  const username = String(body.username || "").trim();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");

  const usernameError = validateUsername(username);
  if (usernameError) return jsonError(usernameError);
  const nameError = validateDisplayName(displayName);
  if (nameError) return jsonError(nameError);
  const passwordError = validatePassword(password, username);
  if (passwordError) return jsonError(passwordError);
  if (password !== confirmPassword) return jsonError("Passwords do not match.");

  const now = nowIso();
  const user = {
    id: crypto.randomUUID(),
    username,
    usernameLower: username.toLowerCase(),
    displayName,
    role: ROLES.ADMIN,
    passwordHash: await hashPassword(password),
    totpEnabled: false,
    totpSecretEnc: null,
    recoveryHashes: [],
    disabled: false,
    createdAt: now,
    lastLoginAt: now,
  };

  let created = null;
  await updateAuthStore((current) => {
    pruneExpired(current);
    if (current.users.length > 0) return current;
    current.users.push(user);
    created = user;
    current.auditLog.push({
      id: crypto.randomUUID(),
      type: "setup",
      userId: user.id,
      at: now,
    });
    return current;
  });

  if (!created) return jsonError("Setup has already been completed.", 409);

  const session = await createSession(created.id, request);
  const response = NextResponse.json({ user: publicUser(created) });
  await setSessionCookie(response, session);
  return response;
}
