'use server';

import { cookies } from 'next/headers';

import { getAccessTokenCookieName } from '@/lib/auth/backend';

export async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getProfileAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(getAccessTokenCookieName())?.value ?? null;
}
