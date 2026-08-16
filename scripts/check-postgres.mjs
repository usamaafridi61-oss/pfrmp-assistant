import { promises as fs } from "fs";
import pg from "pg";

const { Pool } = pg;

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

const env = parseEnvFile(await fs.readFile(".env", "utf-8"));
const url = String(env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL || env.POSTGRES_URL)
  .replace(/[?&]channel_binding=require/g, "")
  .replace(/\?&/, "?");

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

const tables = await pool.query(`
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name
`);
console.log("TABLES");
for (const row of tables.rows) console.log(`${row.table_schema}.${row.table_name}`);

const cols = await pool.query(`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'app_kv'
  ORDER BY ordinal_position
`);
console.log("APP_KV_COLUMNS");
for (const row of cols.rows) console.log(`${row.column_name}:${row.data_type}`);

const rows = await pool.query(`
  SELECT
    key,
    pg_column_size(value) AS bytes,
    updated_at,
    CASE
      WHEN key = 'auth-store' THEN jsonb_array_length(COALESCE(value->'users', '[]'::jsonb))
      ELSE NULL
    END AS users
  FROM app_kv
  ORDER BY key
`);
console.log("ROWS");
for (const row of rows.rows) {
  console.log(`${row.key} bytes=${row.bytes} users=${row.users} updated=${row.updated_at.toISOString()}`);
}

await pool.end();
