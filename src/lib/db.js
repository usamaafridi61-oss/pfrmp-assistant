import { Pool } from "pg";

const AUTH_KEY = "auth-store";
const DATA_KEY = "app-data";

let pool = null;
let tableReady = false;

export function databaseUrl() {
  return String(process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "").trim();
}

export function hasDatabase() {
  return Boolean(databaseUrl());
}

function normalizedUrl() {
  return databaseUrl().replace(/[?&]channel_binding=require/g, "").replace(/\?&/, "?");
}

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: normalizedUrl(),
      ssl: { rejectUnauthorized: false },
      max: process.env.VERCEL ? 1 : 4,
    });
  }
  return pool;
}

export async function ensureKvTable() {
  if (tableReady) return;
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS app_kv (
      key text PRIMARY KEY,
      value jsonb NOT NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  tableReady = true;
}

export async function kvGet(key) {
  await ensureKvTable();
  const { rows } = await getPool().query("SELECT value FROM app_kv WHERE key = $1", [key]);
  return rows[0]?.value ?? null;
}

export async function kvSet(key, value) {
  await ensureKvTable();
  await getPool().query(
    `INSERT INTO app_kv (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, JSON.stringify(value)]
  );
}

export { AUTH_KEY, DATA_KEY };
