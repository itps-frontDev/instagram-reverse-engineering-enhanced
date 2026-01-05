/**
 * @fileoverview API route for updating account privacy settings
 *
 * PUT /api/profiles/privacy - Update account privacy (public/private)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execute, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

interface Profile {
  id: number;
  is_private: number;
}

/**
 * PUT /api/profiles/privacy
 * Update account privacy settings
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = payload.id;

    // Parse request body
    const body = await request.json();
    const { is_private } = body;

    // Validation
    if (typeof is_private !== 'boolean') {
      return NextResponse.json(
        { error: 'is_private must be a boolean value' },
        { status: 400 }
      );
    }

    // Get user's profile_id and current privacy setting
    const profileData = await queryOne<Profile>(
      `SELECT id, is_private FROM profiles WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    const profileId = profileData.id;
    const wasPrivate = profileData.is_private === 1;
    const willBePublic = !is_private;

    // Update privacy setting
    await execute(
      `UPDATE profiles 
       SET is_private = ?, updated_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`,
      [is_private ? 1 : 0, profileId]
    );

    // If switching from private to public, automatically accept all pending follow requests
    if (wasPrivate && willBePublic) {
      // Count pending requests before accepting them
      const pendingCount = await queryOne<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM follows 
         WHERE following_profile_id = ? 
           AND status = 'pending' 
           AND deleted_at IS NULL`,
        [profileId]
      );

      const pendingFollowers = pendingCount?.count || 0;

      // Accept all pending follow requests
      await execute(
        `UPDATE follows 
         SET status = 'accepted', updated_at = datetime('now')
         WHERE following_profile_id = ? 
           AND status = 'pending' 
           AND deleted_at IS NULL`,
        [profileId]
      );

      // Update follower count if there were pending requests
      if (pendingFollowers > 0) {
        await execute(
          `UPDATE profiles 
           SET followers_count = followers_count + ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [pendingFollowers, profileId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      is_private: is_private,
      message: is_private 
        ? 'Account set to private' 
        : 'Account set to public and all pending requests accepted'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/privacy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy settings' },
      { status: 500 }
    );
  }
}
