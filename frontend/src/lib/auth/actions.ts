'use server';

import { cookies } from 'next/headers';

import { getCurrentProfile } from '@/lib/auth';
import { type Profile } from '@/types/profile';
import {
  AuthBackendError,
  getAccessTokenCookieName,
  getAccessTokenCookiePath,
  getRefreshTokenCookieName,
  getRefreshTokenCookiePath,
  loginInputSchema,
  loginWithSpring,
  refreshWithSpring,
} from './backend';
import { sanitizeInternalRedirectPath } from './redirect';

type LoginResult = { redirectTo: string } | { error: string };

function buildTokenCookies(cookieStore: Awaited<ReturnType<typeof cookies>>, payload: {
  accessToken: string; expiresIn: number;
  refreshToken: string; refreshExpiresIn: number;
}) {
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set({ name: getAccessTokenCookieName(), value: payload.accessToken, httpOnly: true, sameSite: 'lax', path: getAccessTokenCookiePath(), maxAge: payload.expiresIn, secure });
  cookieStore.set({ name: getRefreshTokenCookieName(), value: payload.refreshToken, httpOnly: true, sameSite: 'lax', path: getRefreshTokenCookiePath(), maxAge: payload.refreshExpiresIn, secure });
}

export async function loginAction(input: {
  identifier: string;
  password: string;
  redirect?: string;
}): Promise<LoginResult> {
  const parsed = loginInputSchema.safeParse(input);
  if (!parsed.success) return { error: 'Payload non valido.' };

  const redirectTo = sanitizeInternalRedirectPath(input.redirect, '/');

  try {
    const tokenPayload = await loginWithSpring(parsed.data);
    const cookieStore = await cookies();
    buildTokenCookies(cookieStore, tokenPayload);
    return { redirectTo };
  } catch (error) {
    if (error instanceof AuthBackendError) {
      if (error.status === 401) return { error: 'Credenziali non valide.' };
      if (error.status === 429) return { error: 'Account temporaneamente bloccato.' };
      return { error: 'Autenticazione temporaneamente non disponibile.' };
    }
    return { error: 'Autenticazione temporaneamente non disponibile.' };
  }
}

export async function refreshAction(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;
    if (!refreshToken) return false;

    const tokenPayload = await refreshWithSpring(refreshToken);
    buildTokenCookies(cookieStore, tokenPayload);
    return true;
  } catch {
    return false;
  }
}

export async function getMyProfileAction(): Promise<Profile | null> {
  try {
    return await getCurrentProfile();
  } catch {
    return null;
  }
}

const LOGOUT_TIMEOUT_MS = 10_000;

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;
  const refreshToken = cookieStore.get(getRefreshTokenCookieName())?.value;

  if (accessToken && refreshToken) {
    const springBaseUrl = process.env.SPRING_API_BASE_URL ?? 'http://localhost:8080';
    try {
      await fetch(`${springBaseUrl}/api/priv/auth/logout`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(LOGOUT_TIMEOUT_MS),
      });
    } catch {
      // Spring non raggiungibile — si cancellano i cookie comunque
    }
  }

  cookieStore.set({ name: getAccessTokenCookieName(), value: '', path: getAccessTokenCookiePath(), maxAge: 0 });
  cookieStore.set({ name: getRefreshTokenCookieName(), value: '', path: getRefreshTokenCookiePath(), maxAge: 0 });
}
