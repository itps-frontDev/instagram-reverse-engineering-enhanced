/**
 * @fileoverview API endpoint for user suggestions
 *
 * Returns a list of suggested profiles to follow based on:
 * - Users not currently followed
 * - Popular users (high followers count)
 * - Public profiles only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get current user's profile
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get suggested users:
    // - Public profiles only
    // - Not already followed by current user (no accepted follows)
    // - Not the current user themselves
    // - Ordered by followers count (most popular first)
    // - Limit to 5 suggestions
    const suggestions = await queryAll<{
      id: number;
      username: string;
      full_name: string | null;
      profile_image_url: string | null;
      is_verified: number;
      followers_count: number;
      is_following: number;
      follow_status: string | null;
    }>(
      `SELECT
        p.id,
        p.username,
        p.full_name,
        p.profile_image_url,
        p.is_verified,
        p.followers_count,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_profile_id = ?
              AND f.following_profile_id = p.id
              AND f.status = 'accepted'
              AND f.deleted_at IS NULL
          ) THEN 1
          ELSE 0
        END as is_following,
        (
          SELECT f.status FROM follows f
          WHERE f.follower_profile_id = ?
            AND f.following_profile_id = p.id
            AND f.deleted_at IS NULL
          LIMIT 1
        ) as follow_status
      FROM profiles p
      WHERE p.id != ?
        AND p.is_private = 0
        AND p.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_profile_id = ?
            AND f.following_profile_id = p.id
            AND f.status = 'accepted'
            AND f.deleted_at IS NULL
        )
      ORDER BY p.followers_count DESC, p.created_at DESC
      LIMIT 5`,
      [currentProfile.id, currentProfile.id, currentProfile.id, currentProfile.id]
    );

    return NextResponse.json({
      suggestions: suggestions.map((profile) => ({
        ...profile,
        is_verified: Boolean(profile.is_verified),
        isPending: profile.follow_status === 'pending',
        follow_status: undefined, // Remove from response
      })),
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
