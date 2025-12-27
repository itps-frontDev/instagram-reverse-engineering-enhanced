/**
 * @fileoverview API route for unfollowing a user
 *
 * This endpoint removes a follow relationship between the current user
 * and a target profile (soft delete).
 *
 * @module api/profiles/actions/unfollow
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { Profile, UnfollowRequest, UnfollowResponse } from '@/lib/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// POST /api/profiles/actions/unfollow
// ============================================================================

/**
 * Unfollow a user.
 *
 * Requires authentication (mock cookie).
 *
 * @param request - Next.js request object with body { targetProfileId: number }
 * @returns Unfollow response
 *
 * @example
 * // Unfollow a user
 * const response = await fetch('/api/profiles/actions/unfollow', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ targetProfileId: 123 })
 * });
 * const { success, message } = await response.json();
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user's profile
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body: UnfollowRequest = await request.json();
    const { targetProfileId } = body;

    // Validate request
    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'Target profile ID is required' },
        { status: 400 }
      );
    }

    // Cannot unfollow yourself
    if (currentProfile.id === targetProfileId) {
      return NextResponse.json(
        { error: 'Cannot unfollow yourself' },
        { status: 400 }
      );
    }

    // Check if target profile exists
    const targetProfile = await queryOne<Profile>(
      'SELECT id, username FROM profiles WHERE id = ? AND deleted_at IS NULL',
      [targetProfileId]
    );

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Target profile not found' },
        { status: 404 }
      );
    }

    // Check if currently following
    const existingFollow = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [currentProfile.id, targetProfileId]
    );

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 409 }
      );
    }

    const wasAccepted = existingFollow.status === 'accepted';

    // Soft delete follow relationship
    await execute(
      `UPDATE follows
       SET deleted_at = datetime('now')
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [currentProfile.id, targetProfileId]
    );

    // Update following_count for current user
    await execute(
      `UPDATE profiles
       SET following_count = CASE
             WHEN following_count > 0 THEN following_count - 1
             ELSE 0
           END,
           updated_at = datetime('now')
       WHERE id = ?`,
      [currentProfile.id]
    );

    // Update followers_count for target user (only if was accepted)
    if (wasAccepted) {
      await execute(
        `UPDATE profiles
         SET followers_count = CASE
               WHEN followers_count > 0 THEN followers_count - 1
               ELSE 0
             END,
             updated_at = datetime('now')
         WHERE id = ?`,
        [targetProfileId]
      );
    }

    // Return success response
    const response: UnfollowResponse = {
      success: true,
      message: wasAccepted
        ? `Unfollowed ${targetProfile.username}`
        : `Follow request cancelled for ${targetProfile.username}`,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Error unfollowing user:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
