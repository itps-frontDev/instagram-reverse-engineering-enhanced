/**
 * @fileoverview Next.js Middleware for route protection
 *
 * Protects authenticated routes and redirects unauthenticated users to login.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require authentication
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

// Routes that should redirect to home if already authenticated
const authRoutes = ['/login', '/register'];

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-2025'
);

async function verifyJWT(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookie (try both possible names)
  const token = request.cookies.get('auth_token')?.value || request.cookies.get('authToken')?.value;

  console.log('[Middleware]', {
    pathname,
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
  });

  const isAuthenticated = token ? await verifyJWT(token) : false;

  console.log('[Middleware] isAuthenticated:', isAuthenticated);

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if current route is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    console.log('[Middleware] Redirecting to login - no auth for protected route');
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to home if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    console.log('[Middleware] Redirecting to home - already authenticated');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[Middleware] Allowing access to:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
