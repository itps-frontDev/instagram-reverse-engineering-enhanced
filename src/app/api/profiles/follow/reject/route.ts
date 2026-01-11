/**
 * @fileoverview API route for rejecting/deleting a follow request
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { followerId } = body;

    if (!followerId || typeof followerId !== 'number') {
      return NextResponse.json(
        { error: 'Follower ID is required' },
        { status: 400 }
      );
    }

    // Verifica che esista la richiesta
    const existingFollow = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [followerId, currentProfile.id]
    );

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      );
    }

    // Elimina la richiesta (soft delete)
    await execute(
      `UPDATE follows
       SET deleted_at = datetime('now')
       WHERE id = ?`,
      [existingFollow.id]
    );

    // Decrementa following_count per chi ha fatto la richiesta
    await execute(
      `UPDATE profiles
       SET following_count = following_count - 1,
           updated_at = datetime('now')
       WHERE id = ?`,
      [followerId]
    );

    // Se era già accepted, decrementa anche followers_count
    if (existingFollow.status === 'accepted') {
      await execute(
        `UPDATE profiles
         SET followers_count = followers_count - 1,
             updated_at = datetime('now')
         WHERE id = ?`,
        [currentProfile.id]
      );
    }

    // Elimina la notifica
    await execute(
      `UPDATE notifications
       SET deleted_at = datetime('now')
       WHERE sender_profile_id = ?
         AND recipient_profile_id = ?
         AND (type = 'follow_request' OR type = 'follow')
         AND deleted_at IS NULL`,
      [followerId, currentProfile.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Follow request rejected'
    });
  } catch (error) {
    console.error('Error rejecting follow request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
