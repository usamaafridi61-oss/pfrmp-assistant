import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "crypto";
import { promisify } from "util";
import { promises as fs } from "fs";
import path from "path";

const scryptAsync = promisify(scrypt);

const SCRYPT_OPTIONS = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function secretFilePath() {
  return path.resolve(process.cwd(), "data", ".auth-secret");
}

let cachedSecret = null;

export async function getAuthSecret() {
  if (cachedSecret) return cachedSecret;
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32) {
    cachedSecret = process.env.AUTH_SECRET;
    return cachedSecret;
  }

  if (process.env.VERCEL) {
    const fallback = String(process.env.AUTH_ADMIN_PASSWORD || "");
    if (fallback.length >= 8) {
      cachedSecret = createHash("sha256")
        .update(`pfrmp-auth-secret:${fallback}`)
        .digest("base64url");
      return cachedSecret;
    }
    throw new Error("Set AUTH_SECRET (32+ characters) in Vercel environment variables.");
  }

  const file = secretFilePath();
  try {
    const existing = (await fs.readFile(file, "utf-8")).trim();
    if (existing.length >= 32) {
      cachedSecret = existing;
      return cachedSecret;
    }
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }

  const generated = randomBytes(48).toString("base64url");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, generated, { encoding: "utf-8", mode: 0o600 });
  cachedSecret = generated;
  return cachedSecret;
}

function keyFromSecret(secret, label) {
  return createHash("sha256").update(`${label}:${secret}`).digest();
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

export async function verifyPassword(password, stored) {
  try {
    if (!stored || typeof stored !== "string") return false;
    const parts = stored.split("$");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const salt = Buffer.from(parts[1], "base64url");
    const expected = Buffer.from(parts[2], "base64url");
    if (!salt.length || !expected.length) return false;
    const derived = await scryptAsync(password, salt, expected.length, SCRYPT_OPTIONS);
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export async function encryptString(plaintext) {
  const secret = await getAuthSecret();
  const key = keyFromSecret(secret, "aes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

export async function decryptString(payload) {
  const secret = await getAuthSecret();
  const key = keyFromSecret(secret, "aes");
  const parts = String(payload || "").split(".");
  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error("Invalid encrypted payload");
  }
  const iv = Buffer.from(parts[1], "base64url");
  const tag = Buffer.from(parts[2], "base64url");
  const encrypted = Buffer.from(parts[3], "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export async function signValue(value) {
  const secret = await getAuthSecret();
  const hmac = createHmac("sha256", keyFromSecret(secret, "hmac")).update(value).digest("base64url");
  return `${value}.${hmac}`;
}

export async function verifySignedValue(token) {
  if (!token || typeof token !== "string") return null;
  const idx = token.lastIndexOf(".");
  if (idx <= 0) return null;
  const value = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expectedToken = await signValue(value);
  const expectedSig = expectedToken.slice(expectedToken.lastIndexOf(".") + 1);
  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return value;
}

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
