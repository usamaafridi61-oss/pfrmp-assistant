import { signValue, verifySignedValue } from "@/lib/auth/crypto";

export async function encodeSessionToken(session) {
  const payload = Buffer.from(
    JSON.stringify({
      sid: session.id,
      uid: session.userId,
      exp: new Date(session.expiresAt).getTime(),
      seen: new Date(session.lastSeenAt).getTime(),
    }),
    "utf8"
  ).toString("base64url");
  return signValue(payload);
}

export async function decodeSessionToken(token) {
  const payload = await verifySignedValue(token);
  if (!payload) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (data?.sid && data?.uid && data?.exp) return data;
  } catch {
    /* legacy cookies stored only the session id */
  }
  return { sid: payload, uid: null, exp: null, seen: null, legacy: true };
}
