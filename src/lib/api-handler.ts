/**
 * @fileoverview API Route Handler utilities
 * 
 * Fornisce funzioni wrapper per le route API per gestire pattern comuni
 * come autenticazione, gestione errori e validazione richieste.
 * 
 * @module lib/api-handler
 * 
 * @example
 * // Route protetta che richiede autenticazione
 * export const GET = withAuth(async (request, profile) => {
 *   // il profile è già disponibile e verificato
 *   return NextResponse.json({ data: profile });
 * });
 * 
 * @example
 * // Route pubblica con gestione errori
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ data });
 * });
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';
import type { Profile } from '@/types/profile';
import type { User } from '@/types/auth';

// ============================================================================
// TIPI
// ============================================================================

/**
 * Risposta di errore API standard
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  code?: string;
}

/**
 * Funzione handler per route autenticate (con profile)
 */
export type AuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  profile: Profile,
  context?: { params: Record<string, string> }
) => Promise<NextResponse<T>>;

/**
 * Funzione handler per route autenticate (solo con user)
 */
export type UserAuthenticatedHandler<T = unknown> = (
  request: NextRequest,
  user: User,
  context?: { params: Record<string, string> }
) => Promise<NextResponse<T>>;

/**
 * Funzione handler per route pubbliche
 */
export type PublicHandler<T = unknown> = (
  request: NextRequest,
  context?: { params: Record<string, string> }
) => Promise<NextResponse<T>>;

// ============================================================================
// RISPOSTE DI ERRORE
// ============================================================================

/**
 * Crea una risposta di errore non autorizzato
 */
export function unauthorizedResponse(message = 'Unauthorized'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Crea una risposta di errore richiesta non valida
 */
export function badRequestResponse(message = 'Bad request', details?: string): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

/**
 * Crea una risposta di errore non trovato
 */
export function notFoundResponse(message = 'Not found'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Crea una risposta di errore vietato
 */
export function forbiddenResponse(message = 'Forbidden'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Crea una risposta di errore interno del server
 */
export function serverErrorResponse(message = 'Internal server error'): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ error: message }, { status: 500 });
}

// ============================================================================
// WRAPPER PER HANDLER
// ============================================================================

/**
 * Avvolge un handler API con controllo autenticazione (richiede profile).
 * 
 * Automaticamente:
 * - Verifica che l'utente sia autenticato
 * - Recupera il profilo dell'utente corrente
 * - Restituisce 401 se non autenticato
 * - Cattura e logga errori, restituendo 500 in caso di fallimento
 * 
 * @param handler - La funzione handler da avvolgere
 * @returns Un handler avvolto che include il controllo di autenticazione
 * 
 * @example
 * export const GET = withAuth(async (request, profile) => {
 *   // il profile è garantito esistere qui
 *   const posts = await getPostsForProfile(profile.id);
 *   return NextResponse.json({ posts });
 * });
 */
export function withAuth<T = unknown>(
  handler: AuthenticatedHandler<T>
): (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse<T | ApiErrorResponse>> {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const profile = await getCurrentProfile();
      
      if (!profile) {
        return unauthorizedResponse() as NextResponse<T | ApiErrorResponse>;
      }
      
      return await handler(request, profile, context);
    } catch (error) {
      console.error('[API] Error in authenticated handler:', error);
      return serverErrorResponse() as NextResponse<T | ApiErrorResponse>;
    }
  };
}

/**
 * Avvolge un handler API con controllo autenticazione utente (non richiede profile).
 * 
 * Utile per route che necessitano info utente ma non dati del profilo.
 * 
 * @param handler - La funzione handler da avvolgere
 * @returns Un handler avvolto che include il controllo di autenticazione
 * 
 * @example
 * export const GET = withUserAuth(async (request, user) => {
 *   // l'user è garantito esistere qui
 *   return NextResponse.json({ userId: user.id });
 * });
 */
export function withUserAuth<T = unknown>(
  handler: UserAuthenticatedHandler<T>
): (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse<T | ApiErrorResponse>> {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        return unauthorizedResponse() as NextResponse<T | ApiErrorResponse>;
      }
      
      return await handler(request, user, context);
    } catch (error) {
      console.error('[API] Error in user authenticated handler:', error);
      return serverErrorResponse() as NextResponse<T | ApiErrorResponse>;
    }
  };
}

/**
 * Avvolge un handler API con solo gestione errori (nessuna auth richiesta).
 * 
 * Cattura automaticamente errori e restituisce risposte di errore appropriate.
 * 
 * @param handler - La funzione handler da avvolgere
 * @returns Un handler avvolto con gestione errori
 * 
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchPublicData();
 *   return NextResponse.json({ data });
 * });
 */
export function withErrorHandler<T = unknown>(
  handler: PublicHandler<T>
): (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse<T | ApiErrorResponse>> {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('[API] Error in handler:', error);
      return serverErrorResponse() as NextResponse<T | ApiErrorResponse>;
    }
  };
}

/**
 * Avvolge un handler API con autenticazione opzionale.
 * 
 * Il profile viene passato se l'utente è autenticato, altrimenti null.
 * Utile per route che si comportano diversamente per utenti autenticati vs anonimi.
 * 
 * @param handler - La funzione handler da avvolgere
 * @returns Un handler avvolto con autenticazione opzionale
 * 
 * @example
 * export const GET = withOptionalAuth(async (request, profile) => {
 *   if (profile) {
 *     // Mostra contenuto personalizzato
 *     return NextResponse.json({ personalized: true });
 *   }
 *   // Mostra contenuto pubblico
 *   return NextResponse.json({ personalized: false });
 * });
 */
export function withOptionalAuth<T = unknown>(
  handler: (
    request: NextRequest,
    profile: Profile | null,
    context?: { params: Record<string, string> }
  ) => Promise<NextResponse<T>>
): (request: NextRequest, context?: { params: Record<string, string> }) => Promise<NextResponse<T | ApiErrorResponse>> {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const profile = await getCurrentProfile();
      return await handler(request, profile, context);
    } catch (error) {
      console.error('[API] Error in optional auth handler:', error);
      return serverErrorResponse() as NextResponse<T | ApiErrorResponse>;
    }
  };
}

// ============================================================================
// FUNZIONI DI UTILITÀ
// ============================================================================

/**
 * Analizza il body JSON dalla richiesta con gestione errori
 */
export async function parseJsonBody<T = unknown>(request: NextRequest): Promise<T | null> {
  try {
    return await request.json() as T;
  } catch {
    return null;
  }
}

/**
 * Ottiene un parametro query obbligatorio o restituisce una risposta di errore
 */
export function getRequiredParam(
  searchParams: URLSearchParams,
  name: string
): string | NextResponse<ApiErrorResponse> {
  const value = searchParams.get(name);
  if (!value) {
    return badRequestResponse(`Missing required parameter: ${name}`);
  }
  return value;
}

/**
 * Ottiene un parametro query opzionale con un valore di default
 */
export function getOptionalParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: string
): string {
  return searchParams.get(name) ?? defaultValue;
}

/**
 * Ottiene un parametro query numerico
 */
export function getNumericParam(
  searchParams: URLSearchParams,
  name: string,
  defaultValue: number
): number {
  const value = searchParams.get(name);
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}
