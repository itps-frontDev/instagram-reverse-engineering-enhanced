import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
  const response = await fetch(`${backendBaseUrl}/api/v1/auth/logout`, {
    method: 'POST',
    headers: {
      cookie: request.headers.get('cookie') || '',
    },
  });

  const payload = response.ok
    ? await response.json()
    : { message: 'Logout completato con successo' };

  const nextResponse = NextResponse.json(payload, { status: 200 });
  nextResponse.cookies.set('iree_access_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  nextResponse.cookies.set('iree_refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  nextResponse.cookies.set('authToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return nextResponse;
}
