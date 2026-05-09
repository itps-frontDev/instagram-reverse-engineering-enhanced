/**
 * @fileoverview API per ottenere profilo utente corrente
 *
 * GET /api/auth/me
 * Restituisce il profilo dell'utente attualmente autenticato.
 * 
 * USO TIPICO:
 * - Verificare se l'utente è loggato
 * - Ottenere dati del profilo per la UI (header, sidebar, ecc.)
 * - Inizializzare il context di autenticazione nel frontend
 * 
 * FLUSSO:
 * 1. Legge session cookie o access token
 * 2. Recupera i dati utente da Spring se serve
 * 3. Recupera il profilo dal database
 * 4. Restituisce i dati del profilo
 * 
 * @module api/auth/me
 */

import { type NextRequest, NextResponse } from "next/server";

import { profileRepository } from "@/repositories";
import { auth } from "@/lib/auth/index";
import { AuthBackendError, extractBearerToken, meWithSpring } from "@/lib/auth/backend";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const bearerToken = extractBearerToken(request.headers.get("authorization"));
  const session = auth.api.getSession(request.headers);

  if (!bearerToken && !session?.user.id) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  let userId = session?.user.id ?? null;

  if (bearerToken) {
    try {
      const mePayload = await meWithSpring(bearerToken);
      userId = mePayload.id;
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

  if (!userId) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const userIdNumber = Number(userId);
  if (!Number.isFinite(userIdNumber)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const profile = await profileRepository.findByUserId(userIdNumber);

  if (!profile) {
    return NextResponse.json({ error: "Profilo non trovato" }, { status: 404 });
  }

  return NextResponse.json({ profile }, { status: 200 });
}
