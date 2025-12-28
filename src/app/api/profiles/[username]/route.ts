/**
 * @fileoverview API route for getting profile data by username
 *
 * This endpoint returns complete profile information for a given username.
 * It's the primary endpoint for loading profile pages.
 *
 * @module api/profiles/[username]
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Profile, GetProfileResponse } from '@/lib/types/profile';

// ============================================================================
// GET /api/profiles/[username]
// ============================================================================

/**
 * Get profile data by username.
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing username
 * @returns Profile data or error response
 *
 * @example
 * // Fetch profile
 * const response = await fetch('/api/profiles/johndoe');
 * const { profile } = await response.json();
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Fetch profile from database
    const profile = await queryOne<Profile>(
      `SELECT
        id,
        user_id,
        username,
        full_name,
        profile_image_url,
        bio,
        website_url,
        is_private,
        is_verified,
        followers_count,
        following_count,
        posts_count,
        created_at,
        updated_at
      FROM profiles
      WHERE username = ? AND deleted_at IS NULL`,
      [username]
    );

    // Profile not found
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Convert integer booleans to actual booleans
    const profileData: Profile = {
      ...profile,
      is_private: Boolean(profile.is_private),
      is_verified: Boolean(profile.is_verified),
    };

    // Return profile data
    const response: GetProfileResponse = {
      profile: profileData,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching profile:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
