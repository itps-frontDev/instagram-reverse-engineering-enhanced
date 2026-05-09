import { type ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

import { auth, type Session } from "@/lib/auth/index";
import { buildAuthBypassSession, isAuthBypassEnabled } from "@/lib/auth/bypass";
import { isAuthEnforcementEnabled } from "@/lib/auth/enforcement";

export async function getSessionSafe(
  headers: Headers | ReadonlyHeaders,
  context: string
): Promise<Session | null> {
  void context;

  if (!isAuthEnforcementEnabled()) {
    return buildAuthBypassSession();
  }

  if (isAuthBypassEnabled()) {
    return buildAuthBypassSession();
  }

  const session = auth.api.getSession(headers as Headers);
  return session;
}
