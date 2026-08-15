import { NextResponse } from "next/server";
import { pruneExpired, readAuthStore } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = pruneExpired(await readAuthStore());
  return NextResponse.json({
    setupRequired: store.users.length === 0,
  });
}
