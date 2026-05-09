import { type NextRequest, NextResponse } from "next/server";

import { getSessionSafe } from "@/lib/auth/safe-session";

export async function GET(request: NextRequest) {
  const session = await getSessionSafe(request.headers, "api-auth-session");

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    session,
  });
}
