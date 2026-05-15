'use server';

import { cookies } from 'next/headers';
import { profileSuggestionsResponseSchema } from './schema';
import type { ProfileSuggestionsResponse } from './schema';
import { getAccessTokenCookieName } from '@/lib/auth/backend';

/**
 * Fetch profile suggestions for the authenticated user.
 * Returns up to 5 public profiles not yet followed, ordered by popularity with randomization.
 * 
 * @returns Promise with { success, data, error } tuple
 */
export async function getProfileSuggestionsAction(): Promise<ProfileSuggestionsResponse> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;

    if (!accessToken) {
      return {
        success: false,
        error: 'Unauthorized: no access token found',
      };
    }

    const res = await fetch(
      `${process.env.SPRING_API_BASE_URL}/api/priv/profiles/suggestions`,
      {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Server error: ${res.status}`,
      };
    }

    const data = await res.json();

    // Validate response structure with Zod
    const validated = profileSuggestionsResponseSchema.parse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error || 'Unknown error',
      };
    }

    return {
      success: true,
      data: validated.data,
    };
  } catch (error) {
    console.error('Error fetching profile suggestions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch suggestions',
    };
  }
}
