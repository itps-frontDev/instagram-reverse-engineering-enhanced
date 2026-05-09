import { type NextRequest, NextResponse } from "next/server";

import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth/index";
import {
  AuthBackendError,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  buildSessionFromBackendUser,
  isAllowedAuthRequestOrigin,
  loginInputSchema,
  loginWithSpring,
  meWithSpring,
} from "@/lib/auth/backend";
import { sanitizeInternalRedirectPath } from "@/lib/auth/redirect";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  if (!isAllowedAuthRequestOrigin(request)) {
    return NextResponse.json({ error: "Richiesta non autorizzata." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedInput = loginInputSchema.safeParse(body);
  if (!parsedInput.success) {
    return NextResponse.json({ error: "Payload non valido." }, { status: 400 });
  }

  const redirectTo = sanitizeInternalRedirectPath(
    typeof body?.redirect === "string" ? body.redirect : undefined,
    "/"
  );

  try {
    const tokenPayload = await loginWithSpring(parsedInput.data);
    const mePayload = await meWithSpring(tokenPayload.accessToken);

    const session = buildSessionFromBackendUser({
      id: mePayload.id,
      email: mePayload.email ?? null,
      phoneNumber: mePayload.phoneNumber ?? null,
    });

    const response = NextResponse.json({
      message: "Login effettuato con successo",
      user: {
        id: Number(mePayload.id),
        email: mePayload.email ?? null,
        username: mePayload.username ?? null,
        fullName: mePayload.fullName ?? null,
      },
      redirectTo,
      accessToken: tokenPayload.accessToken,
      expiresIn: tokenPayload.expiresIn,
      tokenType: tokenPayload.tokenType,
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
        return NextResponse.json({ error: "Credenziali non valide." }, { status: 401 });
      }

      if (error.status === 429) {
        return NextResponse.json({ error: "Account temporaneamente bloccato." }, { status: 429 });
      }

      logger.warn(
        { event: "auth_login_backend_error", status: error.status, code: error.backendErrorCode },
        "Auth backend login error"
      );

      return NextResponse.json(
        { error: "Autenticazione temporaneamente non disponibile." },
        { status: error.status >= 500 ? 503 : error.status }
      );
    }

    logger.error({ event: "auth_login_unexpected_error", error }, "Unexpected login error");
    return NextResponse.json({ error: "Autenticazione temporaneamente non disponibile." }, { status: 500 });
  }
}
