import { promises as fs } from "fs";
import path from "path";
import { DATA_KEY, hasDatabase, kvGet, kvSet } from "@/lib/db";
import { DEFAULT_DATA, normalizeData } from "@/lib/storage";
import { requireAuth } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

const DATA_FILE = path.resolve(process.cwd(), "data.json");

async function loadAppData() {
  if (hasDatabase()) {
    const stored = await kvGet(DATA_KEY);
    return normalizeData(stored || DEFAULT_DATA);
  }
  try {
    const file = await fs.readFile(DATA_FILE, "utf-8");
    return normalizeData(JSON.parse(file));
  } catch (err) {
    if (err.code === "ENOENT") return DEFAULT_DATA;
    throw err;
  }
}

async function saveAppData(payload) {
  if (hasDatabase()) {
    await kvSet(DATA_KEY, payload);
    return;
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf-8");
}

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const data = await loadAppData();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAuth(request, { write: true });
  if (auth.error) return auth.error;

  try {
    const payload = await request.json();
    await saveAppData(payload);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
