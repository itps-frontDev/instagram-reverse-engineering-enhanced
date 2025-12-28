/**
 * @fileoverview API route for getting follow relationship status
 *
 * This endpoint returns the follow relationship between the current user
 * and the target profile.
 *
 * @module api/profiles/[username]/follow-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Profile, GetFollowStatusResponse, FollowRelationship } from '@/lib/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// GET /api/profiles/[username]/follow-status
// ============================================================================

/**
 * Get follow status between current user and target profile.
 *
 * Requires authentication (mock cookie).
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing username
 * @returns Follow status information
 *
 * @example
 * // Fetch follow status
 * const response = await fetch('/api/profiles/johndoe/follow-status');
 * const { isFollowing, isPending, isOwnProfile } = await response.json();
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

    // Get current user's profile
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch target profile
    const targetProfile = await queryOne<Profile>(
      'SELECT id, username FROM profiles WHERE username = ? AND deleted_at IS NULL',
      [username]
    );

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if it's own profile
    const isOwnProfile = currentProfile.id === targetProfile.id;

    // If own profile, return early with defaults
    if (isOwnProfile) {
      const response: GetFollowStatusResponse = {
        isFollowing: false,
        isFollowedBy: false,
        isPending: false,
        isOwnProfile: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // Check if current user follows target
    const followRelation = await queryOne<FollowRelationship>(
      `SELECT id, status, created_at
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [currentProfile.id, targetProfile.id]
    );

    // Check if target follows current user (for "followed by" indicator)
    const followedByRelation = await queryOne<FollowRelationship>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [targetProfile.id, currentProfile.id]
    );

    // Build response
    const response: GetFollowStatusResponse = {
      isFollowing: followRelation?.status === 'accepted',
      isFollowedBy: followedByRelation?.status === 'accepted',
      isPending: followRelation?.status === 'pending',
      isOwnProfile: false,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching follow status:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
