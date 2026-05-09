import { type NextRequest, NextResponse } from "next/server";

import { serializeSession, SESSION_COOKIE_NAME } from "@/lib/auth";
import {
  AuthBackendError,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  buildSessionFromBackendUser,
  isAllowedAuthRequestOrigin,
  loginInputSchema,
  loginWithSpring,
  mapBackendRoleToAppRole,
  meWithSpring,
} from "@/lib/auth/backend";
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

  try {
    const tokenPayload = await loginWithSpring(parsedInput.data);
    const mePayload = await meWithSpring(tokenPayload.accessToken);

    const role = mapBackendRoleToAppRole(mePayload.role);

    const session = buildSessionFromBackendUser({
      id: mePayload.id,
      email: mePayload.email,
      displayName: mePayload.displayName,
      role,
    });

    const response = NextResponse.json({
      ok: true,
      accessToken: tokenPayload.accessToken,
      expiresIn: tokenPayload.expiresIn,
      tokenType: tokenPayload.tokenType,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: serializeSession(session),
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      expires: new Date(session.expiresAt),
    });

    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: tokenPayload.refreshToken,
      httpOnly: true,
      sameSite: "strict",
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
