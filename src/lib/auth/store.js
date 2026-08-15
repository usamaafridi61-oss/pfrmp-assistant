import { promises as fs } from "fs";
import path from "path";

const STORE_FILE = path.resolve(process.cwd(), "data", "auth-store.json");

const EMPTY_STORE = {
  users: [],
  sessions: [],
  challenges: [],
  totpSetups: [],
  loginAttempts: [],
  auditLog: [],
};

let queue = Promise.resolve();

function enqueue(fn) {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

async function readStoreUnlocked() {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      challenges: Array.isArray(parsed.challenges) ? parsed.challenges : [],
      totpSetups: Array.isArray(parsed.totpSetups) ? parsed.totpSetups : [],
      loginAttempts: Array.isArray(parsed.loginAttempts) ? parsed.loginAttempts : [],
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
    };
  } catch (err) {
    if (err.code === "ENOENT") return { ...EMPTY_STORE, users: [], sessions: [], challenges: [], totpSetups: [], loginAttempts: [], auditLog: [] };
    throw err;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function writeStoreUnlocked(store) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  const tmp = `${STORE_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf-8");

  const maxAttempts = 8;
  let lastError;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      try {
        await fs.rename(tmp, STORE_FILE);
      } catch (err) {
        // Windows cannot always replace an in-use file with rename (EPERM/EACCES).
        if (err.code !== "EPERM" && err.code !== "EACCES" && err.code !== "EEXIST" && err.code !== "EBUSY") {
          throw err;
        }
        await fs.copyFile(tmp, STORE_FILE);
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
    await writeStoreUnlocked(value);
    return value;
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
