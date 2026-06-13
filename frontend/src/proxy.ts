/**
 * @fileoverview Middleware Next.js per protezione route
 *
 * Protegge le route autenticate e reindirizza utenti non loggati al login.
 * 
 * FUNZIONAMENTO:
 * 1. Intercetta tutte le richieste (tranne API, static, ecc.)
 * 2. Verifica il token JWT nel cookie
 * 3. Applica regole di accesso:
 *    - Route protette → richiede autenticazione
 *    - Route auth (login/register) → redirect a home se già loggato
 * 
 * CONFIGURAZIONE:
 * Il `matcher` esclude API routes, file statici e immagini
 * per evitare overhead inutile su queste richieste.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 * @module middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isCookieSecure } from '@/lib/auth/cookie-security';

/**
 * Route che richiedono autenticazione.
 * Se l'utente non è loggato, viene reindirizzato a /login.
 */
const protectedRoutes = [
  '/',
  '/explore',
  '/reels',
  '/direct',
  '/notifications',
  '/profile',
  '/search',
  '/accounts',
];

/**
 * Route di autenticazione.
 * Se l'utente è già loggato, viene reindirizzato a home.
 */
const authRoutes = ['/login', '/register'];

type RefreshedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
};

async function tryRefresh(refreshToken: string): Promise<RefreshedTokens | null> {
  try {
    const springBaseUrl = process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
    const res = await fetch(`${springBaseUrl}/api/public/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      return null;
    }
    return await res.json() as RefreshedTokens;
  } catch (err) {
    return null;
  }
}

function applyTokenCookies(response: NextResponse, tokens: RefreshedTokens, accessTokenName: string, refreshTokenName: string) {
  const secure = isCookieSecure();
  response.cookies.set({
    name: accessTokenName,
    value: tokens.accessToken,
    httpOnly: true,
    sameSite: 'lax',
    path: process.env.AUTH_ACCESS_TOKEN_COOKIE_PATH ?? '/',
    maxAge: tokens.expiresIn,
    secure,
  });
  response.cookies.set({
    name: refreshTokenName,
    value: tokens.refreshToken,
    httpOnly: true,
    sameSite: 'lax',
    path: process.env.AUTH_REFRESH_TOKEN_COOKIE_PATH ?? '/',
    maxAge: tokens.refreshExpiresIn,
    secure,
  });
}

/**
 * Middleware principale per protezione route.
 *
 * @param request - Request Next.js
 * @returns Response (redirect o next)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isServerActionRequest = request.method === 'POST' && request.headers.has('next-action');
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Le Server Actions usano un protocollo di risposta dedicato.
  // Redirect/risposte custom del middleware su queste richieste possono rompere il transport
  // lato client (errore generico) anche quando la mutation server è andata a buon fine.
  if (isServerActionRequest) {
    return NextResponse.next();
  }

  const accessTokenName = process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME ?? 'iree_access_token';
  const refreshTokenName = process.env.AUTH_REFRESH_TOKEN_COOKIE_NAME ?? 'iree_refresh_token';
  const accessToken = request.cookies.get(accessTokenName)?.value;
  const refreshToken = request.cookies.get(refreshTokenName)?.value;

  let isAuthenticated = false;

  if (isProtectedRoute && accessToken) {
    try {
      const springBaseUrl = process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
      const res = await fetch(`${springBaseUrl}/api/priv/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (res.ok) {
        isAuthenticated = true;
      } else if (res.status === 401 && refreshToken) {
        // Token presente ma scaduto lato server — prova refresh silenzioso
        const newTokens = await tryRefresh(refreshToken);
        if (newTokens) {
          const redirectRes = NextResponse.redirect(request.url);
          applyTokenCookies(redirectRes, newTokens, accessTokenName, refreshTokenName);
          return redirectRes;
        }
      }
    } catch {
      isAuthenticated = false;
    }
  } else if (isProtectedRoute && refreshToken) {
    // Cookie access token scaduto — prova refresh silenzioso
    const newTokens = await tryRefresh(refreshToken);
    if (newTokens) {
      const redirectRes = NextResponse.redirect(request.url);
      applyTokenCookies(redirectRes, newTokens, accessTokenName, refreshTokenName);
      return redirectRes;
    }
  }

  // Reindirizza a login se si accede a route protetta senza autenticazione
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Reindirizza a home se si accede a route auth mentre già autenticato
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * Configurazione matcher per il middleware.
 * Esclude le route che non necessitano di verifica autenticazione.
 */
export const config = {
  matcher: [
    /*
     * Intercetta tutte le richieste ECCETTO:
     * - api (API routes - hanno la propria autenticazione)
     * - _next/static (file statici)
     * - _next/image (ottimizzazione immagini)
     * - favicon.ico (icona browser)
     * - File statici (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
