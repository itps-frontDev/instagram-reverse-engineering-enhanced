/**
 * @fileoverview API route for searching users, hashtags, and places
 *
 * This endpoint searches for profiles based on username or full name.
 *
 * @module api/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { getCurrentProfile } from '@/lib/auth';

interface SearchProfile {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
  is_following: number | null;
}

// ============================================================================
// GET /api/search?q=query&type=account
// ============================================================================

/**
 * Search for users by username or full name
 *
 * @param request - Next.js request object
 * @returns Search results or error response
 *
 * @example
 * // Search for users
 * const response = await fetch('/api/search?q=john&type=account');
 * const { results } = await response.json();
 */
export async function GET(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'account';

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { results: [] },
        { status: 200 }
      );
    }

    // Per ora supportiamo solo la ricerca di account
    if (type !== 'account') {
      return NextResponse.json(
        { results: [] },
        { status: 200 }
      );
    }

    const searchTerm = `%${query.trim().toLowerCase()}%`;

    // Search profiles by username or full name
    const results = await queryAll<SearchProfile>(
      `SELECT
        id,
        username,
        full_name,
        profile_image_url,
        is_verified,
        is_private,
        followers_count,
        ${
          currentProfile
            ? `(SELECT 1 FROM follows 
               WHERE follower_profile_id = ? 
               AND following_profile_id = profiles.id 
               AND status = 'accepted' 
               AND deleted_at IS NULL) as is_following`
            : 'NULL as is_following'
        }
      FROM profiles
      WHERE deleted_at IS NULL
        AND (
          LOWER(username) LIKE ? 
          OR LOWER(full_name) LIKE ?
        )
      ORDER BY 
        CASE 
          WHEN LOWER(username) = LOWER(?) THEN 0
          WHEN LOWER(username) LIKE ? THEN 1
          ELSE 2
        END,
        followers_count DESC
      LIMIT 20`,
      currentProfile
        ? [currentProfile.id, searchTerm, searchTerm, query.trim(), `${query.trim().toLowerCase()}%`]
        : [searchTerm, searchTerm, query.trim(), `${query.trim().toLowerCase()}%`]
    );

    // Trasforma is_following e is_verified in boolean
    const transformedResults = results.map((r) => ({
      ...r,
      is_verified: Boolean(r.is_verified),
      is_following: Boolean(r.is_following),
    }));

    return NextResponse.json(
      { results: transformedResults },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error searching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to search profiles' },
      { status: 500 }
    );
  }
}
