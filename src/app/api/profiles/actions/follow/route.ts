/**
 * @fileoverview API route for following a user
 *
 * This endpoint creates a follow relationship between the current user
 * and a target profile. If the target is private, creates a pending request.
 *
 * @module api/profiles/actions/follow
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { Profile, FollowRequest, FollowResponse } from '@/lib/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// POST /api/profiles/actions/follow
// ============================================================================

/**
 * Follow a user.
 *
 * Requires authentication (mock cookie).
 *
 * @param request - Next.js request object with body { targetProfileId: number }
 * @returns Follow response with status (pending or accepted)
 *
 * @example
 * // Follow a user
 * const response = await fetch('/api/profiles/actions/follow', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ targetProfileId: 123 })
 * });
 * const { success, status } = await response.json();
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
    const body: FollowRequest = await request.json();
    const { targetProfileId } = body;

    // Validate request
    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'Target profile ID is required' },
        { status: 400 }
      );
    }

    // Cannot follow yourself
    if (currentProfile.id === targetProfileId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if target profile exists
    const targetProfile = await queryOne<Profile>(
      'SELECT id, username, is_private FROM profiles WHERE id = ? AND deleted_at IS NULL',
      [targetProfileId]
    );

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Target profile not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [currentProfile.id, targetProfileId]
    );

    if (existingFollow) {
      const status = existingFollow.status;
      const message =
        status === 'accepted'
          ? 'Already following this user'
          : 'Follow request already sent';

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    // Determine follow status based on target privacy
    const followStatus = targetProfile.is_private ? 'pending' : 'accepted';

    // Insert follow relationship
    await execute(
      `INSERT INTO follows (follower_profile_id, following_profile_id, status)
       VALUES (?, ?, ?)`,
      [currentProfile.id, targetProfileId, followStatus]
    );

    // Update following_count for current user
    await execute(
      `UPDATE profiles
       SET following_count = following_count + 1,
           updated_at = datetime('now')
       WHERE id = ?`,
      [currentProfile.id]
    );

    // Update followers_count for target user (only if accepted)
    if (followStatus === 'accepted') {
      await execute(
        `UPDATE profiles
         SET followers_count = followers_count + 1,
             updated_at = datetime('now')
         WHERE id = ?`,
        [targetProfileId]
      );
    }

    // Create notification for the target user
    await execute(
      `INSERT INTO notifications (recipient_profile_id, sender_profile_id, type, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [targetProfileId, currentProfile.id, 'follow', 'profile', currentProfile.id]
    );

    // Return success response
    const response: FollowResponse = {
      success: true,
      status: followStatus,
      message:
        followStatus === 'accepted'
          ? `Now following ${targetProfile.username}`
          : `Follow request sent to ${targetProfile.username}`,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Error following user:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
