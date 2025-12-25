/**
 * @fileoverview Authentication utilities (Mock implementation)
 *
 * This file provides temporary mock authentication functions.
 * These will be replaced with the real authentication system
 * from the auth branch once merged.
 *
 * @module lib/auth
 */

import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { Profile } from '@/lib/types/profile';

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
// MOCK AUTH FUNCTIONS
// ============================================================================

/**
 * Get the currently authenticated user.
 *
 * **MOCK IMPLEMENTATION**
 * Uses a cookie `mock_user_id` to simulate authentication.
 * This will be replaced with real session-based auth.
 *
 * @returns The current user or null if not authenticated
 *
 * @example
 * // In an API route
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 * }
 *
 * @example
 * // For testing: Set cookie in browser dev tools
 * document.cookie = "mock_user_id=1; path=/";
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mock_user_id')?.value;

    if (!userId) {
      return null;
    }

    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [parseInt(userId)]
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
 * **MOCK IMPLEMENTATION**
 * Fetches the profile associated with the mock authenticated user.
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

// ============================================================================
// MOCK HELPERS (FOR TESTING)
// ============================================================================

/**
 * Helper to set mock user cookie (for testing in browser console).
 *
 * **CLIENT-SIDE ONLY**
 * Use in browser dev tools console to test different users.
 *
 * @param userId - The user ID to mock
 *
 * @example
 * // In browser console
 * document.cookie = "mock_user_id=1; path=/";
 * // Then refresh page to see as user 1
 *
 * document.cookie = "mock_user_id=2; path=/";
 * // Refresh to see as user 2
 *
 * document.cookie = "mock_user_id=; path=/; max-age=0";
 * // Remove cookie to see as logged-out user
 */
export const MOCK_AUTH_COOKIE_NAME = 'mock_user_id';

/**
 * Instructions for setting up mock authentication for testing.
 */
export const MOCK_AUTH_INSTRUCTIONS = `
Mock Authentication Setup:

1. Open browser dev tools (F12)
2. Go to Console tab
3. Run one of these commands:

   // Login as user 1
   document.cookie = "mock_user_id=1; path=/";

   // Login as user 2
   document.cookie = "mock_user_id=2; path=/";

   // Logout (remove cookie)
   document.cookie = "mock_user_id=; path=/; max-age=0";

4. Refresh the page to apply changes

Note: This is a MOCK implementation for testing.
Real authentication will be provided by the auth branch.
`;
