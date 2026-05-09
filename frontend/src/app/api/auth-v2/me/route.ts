import { type NextRequest, NextResponse } from "next/server";

import {
  AuthBackendError,
  extractBearerToken,
  mapBackendRoleToAppRole,
  meWithSpring,
} from "@/lib/auth/backend";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const accessToken = extractBearerToken(request.headers.get("authorization"));

  if (!accessToken) {
    return NextResponse.json({ error: "Token non valido." }, { status: 401 });
  }

  try {
    const mePayload = await meWithSpring(accessToken);
    const role = mapBackendRoleToAppRole(mePayload.role);

    return NextResponse.json({
      user: {
        id: mePayload.id,
        email: mePayload.email,
        displayName: mePayload.displayName ?? mePayload.email,
        role,
      },
    });
  } catch (error) {
    if (error instanceof AuthBackendError) {
      if (error.status === 401) {
        return NextResponse.json({ error: "Token non valido." }, { status: 401 });
      }

      if (error.status === 403) {
        return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
      }

      return NextResponse.json(
        { error: "Servizio autenticazione non disponibile." },
        { status: error.status >= 500 ? 503 : error.status }
      );
    }

    logger.error({ event: "auth_me_unexpected_error", error }, "Unexpected me error");
    return NextResponse.json({ error: "Servizio autenticazione non disponibile." }, { status: 500 });
  }
}
