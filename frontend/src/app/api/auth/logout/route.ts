import { type NextRequest, NextResponse } from "next/server";

import { SESSION_COOKIE_NAME } from "@/lib/auth/index";
import {
  AuthBackendError,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  extractBearerToken,
  isAllowedAuthRequestOrigin,
  logoutWithSpring,
} from "@/lib/auth/backend";
import { logger } from "@/lib/logger";

function clearAuthCookies(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

export async function POST(request: NextRequest) {
  if (!isAllowedAuthRequestOrigin(request)) {
    return NextResponse.json({ error: "Richiesta non autorizzata." }, { status: 403 });
  }

  const accessToken = extractBearerToken(request.headers.get("authorization"));
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value?.trim() ?? null;

  if (accessToken && refreshToken) {
    try {
      await logoutWithSpring({ accessToken, refreshToken });
    } catch (error) {
      if (error instanceof AuthBackendError) {
        logger.warn(
          { event: "auth_logout_backend_error", status: error.status },
          "Auth backend logout error"
        );
      } else {
        logger.error({ event: "auth_logout_unexpected_error", error }, "Unexpected logout error");
      }
    }
  }

  const response = new NextResponse(null, { status: 204 });
  clearAuthCookies(response);
  return response;
}
