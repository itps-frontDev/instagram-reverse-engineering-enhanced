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
import { getCurrentProfileId } from '@/lib/auth';

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
    type ProfileQueryResult = Omit<Profile, 'has_reels' | 'has_any_active_story' | 'has_active_story' | 'has_viewed_story' | 'is_private' | 'is_verified'> & {
      has_reels: number;
      has_any_active_story: number;
      has_active_story: number;
      has_viewed_story: number;
      is_private: number;
      is_verified: number;
    };
    
    // Get current user's profile ID (if authenticated)
    const currentProfileId = await getCurrentProfileId();
    
    const profile = await queryOne<ProfileQueryResult>(
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
        updated_at,
        (
          SELECT COUNT(*) > 0
          FROM posts p
          INNER JOIN post_media pm ON pm.post_id = p.id
          WHERE p.profile_id = profiles.id
            AND pm.media_type = 'video'
            AND p.deleted_at IS NULL
        ) as has_reels,
        (
          SELECT COUNT(*) > 0
          FROM stories s
          WHERE s.profile_id = profiles.id
            AND s.deleted_at IS NULL
            AND datetime(s.expires_at) > datetime('now')
        ) as has_any_active_story,
        (
          SELECT CASE
            WHEN COUNT(*) > 0 AND EXISTS (
              SELECT 1 FROM stories s2
              WHERE s2.profile_id = profiles.id
              AND s2.deleted_at IS NULL
              AND datetime(s2.expires_at) > datetime('now')
              AND (
                s2.profile_id = ? OR
                s2.profile_id IN (
                  SELECT following_profile_id FROM follows
                  WHERE follower_profile_id = ?
                  AND status = 'accepted'
                ) OR
                profiles.is_private = 0
              )
              AND NOT EXISTS (
                SELECT 1 FROM story_views sv2
                WHERE sv2.story_id = s2.id
                AND sv2.viewer_profile_id = ?
              )
            ) THEN 1 ELSE 0 END
          FROM stories s
          WHERE s.profile_id = profiles.id
            AND s.deleted_at IS NULL
            AND datetime(s.expires_at) > datetime('now')
        ) as has_active_story,
        (
          SELECT COUNT(*) > 0
          FROM story_views sv
          INNER JOIN stories s ON s.id = sv.story_id
          WHERE s.profile_id = profiles.id
            AND sv.viewer_profile_id = ?
            AND s.deleted_at IS NULL
            AND datetime(s.expires_at) > datetime('now')
        ) as has_viewed_story
      FROM profiles
      WHERE username = ? AND deleted_at IS NULL`,
      [currentProfileId || 0, currentProfileId || 0, currentProfileId || 0, currentProfileId || 0, username]
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
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      has_viewed_story: Boolean(profile.has_viewed_story),
      full_name: profile.full_name,
      bio: profile.bio,
      profile_image_url: profile.profile_image_url,
      website_url: profile.website_url,
      followers_count: profile.followers_count,
      following_count: profile.following_count,
      posts_count: profile.posts_count,
      is_private: Boolean(profile.is_private),
      is_verified: Boolean(profile.is_verified),
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      has_reels: Boolean(profile.has_reels),
      has_any_active_story: Boolean(profile.has_any_active_story),
      has_active_story: Boolean(profile.has_active_story),
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
