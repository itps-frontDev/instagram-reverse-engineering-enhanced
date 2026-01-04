/**
 * @fileoverview API route for removing a follower
 *
 * POST /api/profiles/actions/remove-follower
 * - Removes a user from your followers list
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

interface RemoveFollowerRequest {
  targetProfileId: number;
}

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

    const body: RemoveFollowerRequest = await request.json();
    const { targetProfileId } = body;

    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'Target profile ID is required' },
        { status: 400 }
      );
    }

    // Check if the target profile is actually following you
    const followRelation = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [targetProfileId, currentProfile.id]
    );

    if (!followRelation) {
      return NextResponse.json(
        { error: 'This user is not following you' },
        { status: 409 }
      );
    }

    const wasAccepted = followRelation.status === 'accepted';

    // Soft delete the follow relationship
    await execute(
      `UPDATE follows
       SET deleted_at = datetime('now')
       WHERE id = ?`,
      [followRelation.id]
    );

    // Update followers_count for current user (only if was accepted)
    if (wasAccepted) {
      await execute(
        `UPDATE profiles
         SET followers_count = CASE
               WHEN followers_count > 0 THEN followers_count - 1
               ELSE 0
             END
         WHERE id = ?`,
        [currentProfile.id]
      );
    }

    // Update following_count for the follower
    if (wasAccepted) {
      await execute(
        `UPDATE profiles
         SET following_count = CASE
               WHEN following_count > 0 THEN following_count - 1
               ELSE 0
             END
         WHERE id = ?`,
        [targetProfileId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Follower removed successfully',
    });
  } catch (error) {
    console.error('Error removing follower:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
