const COMMON = new Set([
  "password",
  "password123",
  "password1234",
  "admin123",
  "admin1234",
  "letmein",
  "qwerty123",
  "welcome123",
  "changeme",
  "pfrmp123",
  "btasp123",
]);

export function validatePassword(password, username = "") {
  const value = String(password || "");
  if (value.length < 12) {
    return "Password must be at least 12 characters.";
  }
  if (value.length > 128) {
    return "Password is too long.";
  }
  if (username && value.toLowerCase().includes(String(username).toLowerCase())) {
    return "Password must not contain your username.";
  }
  const classes = [
    /[a-z]/.test(value),
    /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;
  if (classes < 3) {
    return "Use a mix of uppercase, lowercase, numbers, and symbols.";
  }
  if (COMMON.has(value.toLowerCase())) {
    return "That password is too common.";
  }
  return null;
}

export function validateUsername(username) {
  const value = String(username || "").trim();
  if (!/^[a-zA-Z][a-zA-Z0-9._-]{2,31}$/.test(value)) {
    return "Username must be 3–32 characters and start with a letter.";
  }
  return null;
}

export function validateDisplayName(name) {
  const value = String(name || "").trim();
  if (value.length < 2 || value.length > 80) {
    return "Full name must be between 2 and 80 characters.";
  }
  return null;
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    totpEnabled: Boolean(user.totpEnabled),
    disabled: Boolean(user.disabled),
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || null,
  };
}
