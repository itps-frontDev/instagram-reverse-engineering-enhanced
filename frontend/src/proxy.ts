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

/**
 * Middleware principale per protezione route.
 * 
 * @param request - Request Next.js
 * @returns Response (redirect o next)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessTokenCookieName = process.env.AUTH_ACCESS_TOKEN_COOKIE_NAME ?? 'iree_access_token';
  const accessToken = request.cookies.get(accessTokenCookieName)?.value;

  let isAuthenticated = false;
  if (accessToken) {
    try {
      const springBaseUrl = process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
      const res = await fetch(`${springBaseUrl}/api/priv/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      isAuthenticated = res.ok;
    } catch {
      isAuthenticated = false;
    }
  }

  // Verifica se la route corrente è protetta
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Verifica se la route corrente è una route di autenticazione
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Reindirizza a login se si accede a route protetta senza autenticazione
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname); // Salva URL per redirect post-login
    return NextResponse.redirect(url);
  }

  // Reindirizza a home se si accede a route auth mentre già autenticato
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Nessuna regola applicata, continua normalmente
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
