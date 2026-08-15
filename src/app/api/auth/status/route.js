import { NextResponse } from "next/server";
import { envAdminConfigured } from "@/lib/auth/envAdmin";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = pruneExpired(await readAuthStore());
  return NextResponse.json({
    setupRequired: envAdminConfigured() ? false : store.users.length === 0,
    hosted: Boolean(process.env.VERCEL),
  });
}
