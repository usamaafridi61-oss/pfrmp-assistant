import { NextResponse } from "next/server";
import { envAdminConfigured } from "@/lib/auth/envAdmin";
import { hasDatabase } from "@/lib/db-env";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = pruneExpired(await readAuthStore());
    return NextResponse.json({
      setupRequired: envAdminConfigured() || hasDatabase() ? false : store.users.length === 0,
      hosted: Boolean(process.env.VERCEL),
      userCount: store.users.filter((user) => !user.fromEnv).length,
    });
  } catch {
    return NextResponse.json({
      setupRequired: !(envAdminConfigured() || hasDatabase()),
      hosted: Boolean(process.env.VERCEL),
      userCount: 0,
    });
  }
}
