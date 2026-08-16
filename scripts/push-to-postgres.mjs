import { promises as fs } from "fs";
import path from "path";
import pg from "pg";

const { Pool } = pg;
const root = process.cwd();

function parseEnvFile(raw) {
  const values = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const uncommented = trimmed.startsWith("#") ? trimmed.replace(/^#\s*/, "") : trimmed;
    const match = uncommented.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim();
  }
  return values;
}

function cleanUrl(url) {
  const raw = String(url || "");
  try {
    const parsed = new URL(raw);
    parsed.searchParams.delete("channel_binding");
    return parsed.toString();
  } catch {
    return raw;
  }
}

async function main() {
  const envRaw = await fs.readFile(path.join(root, ".env"), "utf-8");
  const env = parseEnvFile(envRaw);
  const url = cleanUrl(env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL);
  if (!url) {
    throw new Error("No DATABASE_URL found in .env");
  }

  const auth = JSON.parse(await fs.readFile(path.join(root, "data", "auth-store.json"), "utf-8"));
  const appData = JSON.parse(await fs.readFile(path.join(root, "data.json"), "utf-8"));

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_kv (
        key text PRIMARY KEY,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const persistableAuth = {
      users: auth.users || [],
      sessions: [],
      challenges: [],
      totpSetups: [],
      loginAttempts: [],
      auditLog: auth.auditLog || [],
    };

    await pool.query(
      `INSERT INTO app_kv (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      ["auth-store", JSON.stringify(persistableAuth)]
    );

    await pool.query(
      `INSERT INTO app_kv (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      ["app-data", JSON.stringify(appData)]
    );

    const check = await pool.query("SELECT key, jsonb_array_length(COALESCE(value->'users', '[]'::jsonb)) AS users FROM app_kv WHERE key = 'auth-store'");
    const dataCheck = await pool.query("SELECT key, pg_column_size(value) AS bytes FROM app_kv ORDER BY key");
    console.log("Uploaded users:", check.rows[0]?.users ?? 0);
    for (const row of dataCheck.rows) {
      console.log(`${row.key}: ${row.bytes} bytes`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
