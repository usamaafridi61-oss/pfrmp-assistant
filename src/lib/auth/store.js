import { promises as fs } from "fs";
import path from "path";
import { AUTH_KEY, hasDatabase } from "@/lib/db-env";
import { mergeEnvAdmin } from "@/lib/auth/envAdmin";

function storeFilePath() {
  if (process.env.VERCEL) {
    return path.join("/tmp", "pfrmp-auth-store.json");
  }
  return path.resolve(process.cwd(), "data", "auth-store.json");
}

const EMPTY_STORE = {
  users: [],
  sessions: [],
  challenges: [],
  totpSetups: [],
  loginAttempts: [],
  auditLog: [],
};

let queue = Promise.resolve();
let memoryStore = null;

function enqueue(fn) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function cloneEmpty() {
  return {
    users: [],
    sessions: [],
    challenges: [],
    totpSetups: [],
    loginAttempts: [],
    auditLog: [],
  };
}

function normalizeStore(parsed) {
  return mergeEnvAdmin({
    users: Array.isArray(parsed?.users) ? parsed.users : [],
    sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
    challenges: Array.isArray(parsed?.challenges) ? parsed.challenges : [],
    totpSetups: Array.isArray(parsed?.totpSetups) ? parsed.totpSetups : [],
    loginAttempts: Array.isArray(parsed?.loginAttempts) ? parsed.loginAttempts : [],
    auditLog: Array.isArray(parsed?.auditLog) ? parsed.auditLog : [],
  });
}

function persistableStore(store) {
  return {
    users: (store.users || []).filter((user) => !user.fromEnv),
    sessions: store.sessions || [],
    challenges: store.challenges || [],
    totpSetups: store.totpSetups || [],
    loginAttempts: store.loginAttempts || [],
    auditLog: store.auditLog || [],
  };
}

function isIgnorableFsError(err) {
  return err?.code === "EROFS" || err?.code === "EPERM" || err?.code === "EACCES" || err?.code === "ENOENT";
}

async function readStoreUnlocked() {
  if (memoryStore) return memoryStore;
  if (hasDatabase()) {
    const { kvGet } = await import("@/lib/db");
    const parsed = await kvGet(AUTH_KEY);
    memoryStore = normalizeStore(parsed || cloneEmpty());
    return memoryStore;
  }
  try {
    const raw = await fs.readFile(storeFilePath(), "utf-8");
    memoryStore = normalizeStore(JSON.parse(raw));
    return memoryStore;
  } catch (err) {
    if (err.code === "ENOENT") {
      memoryStore = normalizeStore(cloneEmpty());
      return memoryStore;
    }
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeStoreUnlocked(store) {
  const payload = persistableStore(store);
  if (hasDatabase()) {
    const { kvSet } = await import("@/lib/db");
    await kvSet(AUTH_KEY, payload);
    return;
  }

  const file = storeFilePath();
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf-8");

  const maxAttempts = 8;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      try {
        await fs.rename(tmp, file);
      } catch (err) {
        if (err.code !== "EPERM" && err.code !== "EACCES" && err.code !== "EEXIST" && err.code !== "EBUSY") {
          throw err;
        }
        await fs.copyFile(tmp, file);
        await fs.unlink(tmp).catch(() => undefined);
      }
      return;
    } catch (err) {
      lastError = err;
      const retryable = err.code === "EPERM" || err.code === "EACCES" || err.code === "EBUSY";
      if (!retryable || attempt === maxAttempts - 1) break;
      await sleep(25 * (attempt + 1));
    }
  }

  await fs.unlink(tmp).catch(() => undefined);
  throw lastError;
}

export function readAuthStore() {
  return enqueue(() => readStoreUnlocked());
}

export function updateAuthStore(mutator) {
  return enqueue(async () => {
    const store = await readStoreUnlocked();
    const next = await mutator(store);
    const value = next || store;
    memoryStore = normalizeStore(value);
    try {
      await writeStoreUnlocked(memoryStore);
    } catch (err) {
      if (!isIgnorableFsError(err)) throw err;
    }
    return memoryStore;
  });
}

export function nowIso() {
  return new Date().toISOString();
}

export function pruneExpired(store, now = Date.now()) {
  store.sessions = store.sessions.filter((s) => new Date(s.expiresAt).getTime() > now && !s.revokedAt);
  store.challenges = store.challenges.filter((c) => new Date(c.expiresAt).getTime() > now);
  store.totpSetups = store.totpSetups.filter((t) => new Date(t.expiresAt).getTime() > now);
  store.loginAttempts = store.loginAttempts.filter((a) => now - new Date(a.at).getTime() < 24 * 60 * 60 * 1000);
  if (store.auditLog.length > 500) {
    store.auditLog = store.auditLog.slice(-500);
  }
  return store;
}

export { EMPTY_STORE };
