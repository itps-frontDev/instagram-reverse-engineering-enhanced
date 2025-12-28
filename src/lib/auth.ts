/**
 * @fileoverview Authentication utilities
 *
 * This file provides authentication functions using JWT tokens stored in HTTP-only cookies.
 *
 * @module lib/auth
 */

import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { Profile } from '@/lib/types/profile';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

// ============================================================================
// CONSTANTS
// ============================================================================

export const AUTH_COOKIE_NAME = 'authToken';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Basic user information from the users table
 */
export interface User {
  id: number;
  email: string | null;
  phone_number: string | null;
}

// ============================================================================
// AUTH FUNCTIONS
// ============================================================================

/**
 * Get the current authenticated user from the JWT token.
 *
 * Reads the authToken from HTTP-only cookies, verifies it, and fetches user data.
 *
 * @returns The current user or null if not authenticated
 *
 * @example
 * // In an API route
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verify and decode JWT token
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Fetch user from database
    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [payload.id]
    );

    return user || null;
  } catch (error) {
    console.error('[Auth] Error getting current user:', error);
    return null;
  }
}

/**
 * Get the profile for the currently authenticated user.
 *
 * Fetches the profile associated with the authenticated user from the JWT token.
 *
 * @returns The current user's profile or null if not authenticated
 *
 * @example
 * // In an API route
 * const currentProfile = await getCurrentProfile();
 * if (!currentProfile) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 * console.log(`Current user: ${currentProfile.username}`);
 */
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
    console.error('[Auth] Error getting current profile:', error);
    return null;
  }
}

/**
 * Check if a user is authenticated.
 *
 * @returns true if user is authenticated, false otherwise
 *
 * @example
 * // In a server component
 * const isAuth = await isAuthenticated();
 * if (!isAuth) {
 *   redirect('/login');
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get the current user's ID.
 *
 * @returns The user ID or null if not authenticated
 *
 * @example
 * // Quick check for user ID
 * const userId = await getCurrentUserId();
 * if (!userId) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Get the current user's profile ID.
 *
 * @returns The profile ID or null if not authenticated
 *
 * @example
 * // Check if user owns a resource
 * const currentProfileId = await getCurrentProfileId();
 * if (currentProfileId === resourceOwnerId) {
 *   // Allow edit
 * }
 */
export async function getCurrentProfileId(): Promise<number | null> {
  const profile = await getCurrentProfile();
  return profile?.id || null;
}

/**
 * Get the JWT token payload without fetching user data.
 * Faster than getCurrentUser() when you only need basic info from the token.
 *
 * @returns The token payload or null if not authenticated
 *
 * @example
 * // Quick check for user ID without DB query
 * const payload = await getTokenPayload();
 * if (payload) {
 *   console.log('User ID:', payload.id);
 * }
 */
export async function getTokenPayload(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } catch (error) {
    console.error('[Auth] Error getting token payload:', error);
    return null;
  }
}
