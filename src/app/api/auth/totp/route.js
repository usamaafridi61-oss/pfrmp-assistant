import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { TOTP_SETUP_MS } from "@/lib/auth/constants";
import { encryptString, decryptString, randomToken, sha256 } from "@/lib/auth/crypto";
import { requireAuth } from "@/lib/auth/guard";
import { jsonError } from "@/lib/auth/session";
import { nowIso, pruneExpired, updateAuthStore } from "@/lib/auth/store";
import { buildOtpAuthUrl, generateRecoveryCodes, generateTotpSecret, verifyTotpCode } from "@/lib/auth/totp";

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  if (auth.user.totpEnabled) {
    return jsonError("Authenticator is already enabled.");
  }

  const secret = generateTotpSecret();
  const otpauthUrl = buildOtpAuthUrl(auth.user.username, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
    margin: 1,
    width: 220,
    color: { dark: "#0f1f17", light: "#ffffff" },
  });

  const setupId = randomToken(18);
  await updateAuthStore((store) => {
    pruneExpired(store);
    store.totpSetups = store.totpSetups.filter((t) => t.userId !== auth.user.id);
    store.totpSetups.push({
      id: setupId,
      userId: auth.user.id,
      secret,
      expiresAt: new Date(Date.now() + TOTP_SETUP_MS).toISOString(),
    });
    return store;
  });

  return NextResponse.json({
    setupId,
    secret,
    otpauthUrl,
    qrDataUrl,
  });
}

export async function PUT(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request.");
  }

  const setupId = String(body.setupId || "");
  const code = String(body.totp || "").trim();

  let secret = null;
  await updateAuthStore((store) => {
    pruneExpired(store);
    const setup = store.totpSetups.find((t) => t.id === setupId && t.userId === auth.user.id);
    if (setup) secret = setup.secret;
    return store;
  });

  if (!secret) return jsonError("Authenticator setup expired. Generate a new QR code.");
  if (!verifyTotpCode(secret, code)) return jsonError("Invalid authenticator code. Check the time on your device.");

  const recoveryCodes = generateRecoveryCodes();
  const recoveryHashes = recoveryCodes.map((codeValue) => sha256(codeValue));
  const totpSecretEnc = await encryptString(secret);

  await updateAuthStore((store) => {
    pruneExpired(store);
    const user = store.users.find((u) => u.id === auth.user.id);
    if (user) {
      user.totpEnabled = true;
      user.totpSecretEnc = totpSecretEnc;
      user.recoveryHashes = recoveryHashes;
      user.totpEnabledAt = nowIso();
    }
    store.totpSetups = store.totpSetups.filter((t) => t.userId !== auth.user.id);
    store.auditLog.push({
      id: randomToken(12),
      type: "totp_enabled",
      userId: auth.user.id,
      at: nowIso(),
    });
    return store;
  });

  return NextResponse.json({
    ok: true,
    recoveryCodes,
  });
}

export async function DELETE(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const code = String(body.totp || "").trim();
  if (!auth.user.totpEnabled) return jsonError("Authenticator is not enabled.");

  let secret;
  try {
    secret = await decryptString(auth.user.totpSecretEnc);
  } catch {
    return jsonError("Could not verify authenticator. Ask an administrator to reset it.");
  }
  if (!verifyTotpCode(secret, code)) return jsonError("Invalid authenticator code.");

  await updateAuthStore((store) => {
    const user = store.users.find((u) => u.id === auth.user.id);
    if (user) {
      user.totpEnabled = false;
      user.totpSecretEnc = null;
      user.recoveryHashes = [];
      user.totpEnabledAt = null;
    }
    store.auditLog.push({
      id: randomToken(12),
      type: "totp_disabled",
      userId: auth.user.id,
      at: nowIso(),
    });
    return store;
  });

  return NextResponse.json({ ok: true });
}
