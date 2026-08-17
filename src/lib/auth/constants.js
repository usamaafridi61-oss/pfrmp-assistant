export const AUTH_COOKIE = "pfrmp_session";

export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

export const ROLE_LABELS = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

export const WRITE_ROLES = new Set([ROLES.ADMIN, ROLES.EDITOR]);

export const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000;
export const SESSION_IDLE_MS = SESSION_MAX_AGE_MS;
export const LOGIN_CHALLENGE_MS = 5 * 60 * 1000;
export const TOTP_SETUP_MS = 10 * 60 * 1000;

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

/** Set true later to require TOTP after username/password. */
export const REQUIRE_TOTP = false;

export const PUBLIC_PATHS = ["/login", "/setup"];
export const PUBLIC_API_PREFIXES = [
  "/api/auth/status",
  "/api/auth/setup",
  "/api/auth/login",
];

export const ISSUER = "PFRMP Assistant";
