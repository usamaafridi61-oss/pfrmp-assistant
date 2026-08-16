import { NextResponse } from "next/server";
import { decryptString, hashPassword, sha256, verifyPassword } from "@/lib/auth/crypto";
import {
  assertSameOrigin,
  clearFailures,
  consumeLoginChallenge,
  createLoginChallenge,
  createSession,
  isLockedOut,
  jsonError,
  recordFailedLogin,
  setSessionCookie,
  userPayload,
} from "@/lib/auth/session";
import { REQUIRE_TOTP } from "@/lib/auth/constants";
import { verifyEnvAdminPassword } from "@/lib/auth/envAdmin";
import { pruneExpired, readAuthStore, updateAuthStore } from "@/lib/auth/store";
import { verifyTotpCode } from "@/lib/auth/totp";

const dummyHashPromise = hashPassword("not-a-real-user-password-placeholder");

async function finishLogin(user, request) {
  const session = await createSession(user.id, request);
  await clearFailures(user.username, request);
  const response = NextResponse.json({
    user: userPayload(user),
    requiresTotp: false,
  });
  await setSessionCookie(response, session);
  return response;
}

export async function POST(request) {
  const csrf = assertSameOrigin(request);
  if (csrf) return csrf;

  try {
    return await handleLogin(request);
  } catch (err) {
    console.error("login failed", err);
    return jsonError("Could not sign in. Check DATABASE_URL on Vercel and try again.", 500);
  }
}

async function handleLogin(request) {

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  if (body.challengeId) {
    const challenge = await consumeLoginChallenge(String(body.challengeId));
    if (!challenge) return jsonError("Authenticator challenge expired. Sign in again.");

    const store = pruneExpired(await readAuthStore());
    const user = store.users.find((u) => u.id === challenge.userId && !u.disabled);
    if (!user) return jsonError("Account is no longer available.", 403);

    const totp = String(body.totp || "").trim();
    const recoveryCode = String(body.recoveryCode || "").trim().toUpperCase();

    if (totp) {
      if (!user.totpSecretEnc) return jsonError("Authenticator is not configured.", 400);
      let secret;
      try {
        secret = await decryptString(user.totpSecretEnc);
      } catch {
        return jsonError("Authenticator secret could not be read. Ask an administrator to reset it.", 500);
      }
      if (!verifyTotpCode(secret, totp)) {
        return jsonError("Invalid authenticator code.");
      }
      return finishLogin(user, request);
    }

    if (recoveryCode) {
      const hash = sha256(recoveryCode.replace(/\s/g, ""));
      const match = (user.recoveryHashes || []).includes(hash);
      if (!match) return jsonError("Invalid recovery code.");
      await updateAuthStore((current) => {
        const target = current.users.find((u) => u.id === user.id);
        if (target) {
          target.recoveryHashes = (target.recoveryHashes || []).filter((h) => h !== hash);
        }
        return current;
      });
      return finishLogin(user, request);
    }

    return jsonError("Enter the 6-digit authenticator code.");
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "");
  if (!username || !password) return jsonError("Enter your username and password.");

  const lockedMs = await isLockedOut(username, request);
  if (lockedMs) {
    const minutes = Math.max(1, Math.ceil(lockedMs / 60000));
    return jsonError(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, 429);
  }

  const store = pruneExpired(await readAuthStore());
  const user = store.users.find((u) => u.usernameLower === username.toLowerCase());
  const valid = user?.fromEnv
    ? verifyEnvAdminPassword(password)
    : await verifyPassword(password, user?.passwordHash || (await dummyHashPromise));

  if (!user || user.disabled || !valid) {
    await recordFailedLogin(username, request);
    return jsonError("Invalid username or password.", 401);
  }

  if (REQUIRE_TOTP && user.totpEnabled) {
    const challenge = await createLoginChallenge(user.id);
    return NextResponse.json({
      requiresTotp: true,
      challengeId: challenge.id,
      username: user.username,
    });
  }

  return finishLogin(user, request);
}
