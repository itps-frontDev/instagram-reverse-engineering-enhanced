import { type ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

import { type Session } from "@/lib/auth/index";
import { buildAuthBypassSession, isAuthBypassEnabled } from "@/lib/auth/bypass";
import { AuthBackendError, getAccessTokenCookieName, meWithSpring } from "@/lib/auth/backend";

function readCookieFromHeaders(headers: Headers | ReadonlyHeaders, name: string): string | null {
  const cookieHeader = (headers as Headers).get("cookie");
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getSessionSafe(
  headers: Headers | ReadonlyHeaders,
  context: string
): Promise<Session | null> {
  void context;

  if (isAuthBypassEnabled()) {
    return buildAuthBypassSession();
  }

  let cookieName: string;
  try {
    cookieName = getAccessTokenCookieName();
  } catch {
    return null;
  }

  const accessToken = readCookieFromHeaders(headers, cookieName);
  if (!accessToken) return null;

  try {
    const me = await meWithSpring(accessToken);
    return {
      user: {
        id: me.id,
        email: me.email ?? null,
        phoneNumber: me.phoneNumber ?? null,
        username: me.username ?? null,
      },
    };
  } catch (error) {
    if (error instanceof AuthBackendError) return null;
    return null;
  }
}
