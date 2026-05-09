import { type NextRequest, NextResponse } from "next/server";

import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth/index";
import {
  AuthBackendError,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  buildSessionFromBackendUser,
  isAllowedAuthRequestOrigin,
  meWithSpring,
  refreshWithSpring,
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

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value?.trim();
  if (!refreshToken) {
    return NextResponse.json({ error: "Sessione scaduta. Effettua di nuovo l'accesso." }, { status: 401 });
  }

  try {
    const tokenPayload = await refreshWithSpring(refreshToken);
    const mePayload = await meWithSpring(tokenPayload.accessToken);

    const session = buildSessionFromBackendUser({
      id: mePayload.id,
      email: mePayload.email ?? null,
      phoneNumber: mePayload.phoneNumber ?? null,
    });

    const response = NextResponse.json({
      ok: true,
      accessToken: tokenPayload.accessToken,
      expiresIn: tokenPayload.expiresIn,
      tokenType: tokenPayload.tokenType,
      user: {
        id: session.user.id,
        email: session.user.email,
        phoneNumber: session.user.phoneNumber ?? null,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: serializeSession(session),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expiresAt),
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: tokenPayload.refreshToken,
      httpOnly: true,
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      secure: process.env.NODE_ENV === "production",
      maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
    });

    return response;
  } catch (error) {
    if (error instanceof AuthBackendError) {
      if (error.status === 401) {
        const response = NextResponse.json(
          { error: "Sessione scaduta. Effettua di nuovo l'accesso." },
          { status: 401 }
        );
        clearAuthCookies(response);
        return response;
      }

      logger.warn(
        { event: "auth_refresh_backend_error", status: error.status, code: error.backendErrorCode },
        "Auth backend refresh error"
      );

      return NextResponse.json(
        { error: "Autenticazione temporaneamente non disponibile." },
        { status: error.status >= 500 ? 503 : error.status }
      );
    }

    logger.error({ event: "auth_refresh_unexpected_error", error }, "Unexpected refresh error");
    return NextResponse.json({ error: "Autenticazione temporaneamente non disponibile." }, { status: 500 });
  }
}
