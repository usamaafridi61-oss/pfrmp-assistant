import { neon } from "@neondatabase/serverless";
import { AUTH_KEY, DATA_KEY, databaseUrl, hasDatabase } from "@/lib/db-env";

let sql = null;
let tableReady = false;

function normalizedUrl() {
  const raw = databaseUrl();
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return raw;
  }
}

function getSql() {
  if (!sql) sql = neon(normalizedUrl());
  return sql;
}

export async function ensureKvTable() {
  if (tableReady) return;
  await getSql()`
    CREATE TABLE IF NOT EXISTS app_kv (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
  tableReady = true;
}

export async function kvGet(key) {
  await ensureKvTable();
  const rows = await getSql()`SELECT value FROM app_kv WHERE key = ${key}`;
  return rows[0]?.value ?? null;
}

export async function kvSet(key, value) {
  await ensureKvTable();
  const payload = JSON.stringify(value);
  await getSql()`
    INSERT INTO app_kv (key, value, updated_at)
    VALUES (${key}, ${payload}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
}

export { AUTH_KEY, DATA_KEY, databaseUrl, hasDatabase };
