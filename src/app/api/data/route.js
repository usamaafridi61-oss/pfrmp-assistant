import { promises as fs } from 'fs';
import path from 'path';
import { DEFAULT_DATA, normalizeData } from '@/lib/storage';

const DATA_FILE = path.resolve(process.cwd(), 'data.json');

export async function GET(request) {
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
