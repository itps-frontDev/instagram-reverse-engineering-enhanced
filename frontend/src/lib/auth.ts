import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { Profile } from '@/types/profile';
import { type TokenPayload } from '@/lib/jwt';

export const AUTH_COOKIE_NAME = 'iree_access_token';
const BACKEND_AUTH_ME_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/auth/me`;

export interface User {
  id: number;
  email: string | null;
  phone_number: string | null;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(({ name, value }) => `${name}=${value}`).join('; ');

    if (!cookieHeader) {
      return null;
    }

    const response = await fetch(BACKEND_AUTH_ME_URL, {
      method: 'GET',
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (!data?.user?.id) {
      return null;
    }

    return {
      id: Number(data.user.id),
      email: data.user.email ?? null,
      phone_number: data.user.phoneNumber ?? null,
    };
  } catch (error) {
    console.error('[Auth] Errore nel recupero dell\'utente corrente:', error);
    return null;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const profile = await queryOne<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified,
        followers_count, following_count, posts_count,
        created_at, updated_at
       FROM profiles
       WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    return profile || null;
  } catch (error) {
    console.error('[Auth] Errore nel recupero del profilo corrente:', error);
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

export async function getCurrentProfileId(): Promise<number | null> {
  const profile = await getCurrentProfile();
  return profile?.id || null;
}

export async function getTokenPayload(): Promise<TokenPayload | null> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    username: profile?.username ?? null,
  };
}
