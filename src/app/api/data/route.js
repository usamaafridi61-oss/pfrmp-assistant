import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_DATA, normalizeData } from '@/lib/storage';
import { requireAuth } from '@/lib/auth/guard';

export const dynamic = "force-dynamic";

const DATA_FILE = path.resolve(process.cwd(), 'data.json');

export async function GET(request) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const file = await fs.readFile(DATA_FILE, 'utf-8');
    const data = normalizeData(JSON.parse(file));
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    // If file does not exist, return empty object
    if (err.code === 'ENOENT') {
      return new Response(JSON.stringify(DEFAULT_DATA), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(request) {
  const auth = await requireAuth(request, { write: true });
  if (auth.error) return auth.error;

  try {
    const payload = await request.json();
    await fs.writeFile(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
