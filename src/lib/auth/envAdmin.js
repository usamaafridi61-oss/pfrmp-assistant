import { ROLES } from "@/lib/auth/constants";
import { safeEqual } from "@/lib/auth/crypto";

export const ENV_ADMIN_ID = "env-admin";

export function envAdminConfigured() {
  return Boolean(String(process.env.AUTH_ADMIN_USERNAME || "").trim() && process.env.AUTH_ADMIN_PASSWORD);
}

export function getEnvAdmin() {
  if (!envAdminConfigured()) return null;
  const username = String(process.env.AUTH_ADMIN_USERNAME).trim();
  return {
    id: ENV_ADMIN_ID,
    username,
    usernameLower: username.toLowerCase(),
    displayName: String(process.env.AUTH_ADMIN_NAME || username).trim() || username,
    role: ROLES.ADMIN,
    passwordHash: "env",
    fromEnv: true,
    totpEnabled: false,
    totpSecretEnc: null,
    recoveryHashes: [],
    disabled: false,
    createdAt: "2024-01-01T00:00:00.000Z",
    lastLoginAt: null,
  };
}

export function verifyEnvAdminPassword(password) {
  return safeEqual(String(password || ""), String(process.env.AUTH_ADMIN_PASSWORD || ""));
}

export function mergeEnvAdmin(store) {
  const envUser = getEnvAdmin();
  if (!envUser) return store;
  const exists = store.users.some(
    (user) => user.id === envUser.id || user.usernameLower === envUser.usernameLower
  );
  if (!exists) store.users.unshift(envUser);
  return store;
}
