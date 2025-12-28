/**
 * @fileoverview Logout API endpoint
 *
 * Clears the authentication token cookie to log out the user.
 */

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout completato con successo' },
    { status: 200 }
  );

  // Clear the auth cookie
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Immediately expire
  });

  return response;
}
