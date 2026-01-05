/**
 * @fileoverview API endpoint for fetching profile followers
 *
 * GET /api/profiles/[username]/followers
 * - Returns list of users who follow the profile
 * - Respects privacy settings (private profiles)
 * - Includes follow status for each follower
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll, queryOne } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    // 1. Ottenere profilo target
    const targetProfile = await queryOne(
      'SELECT * FROM profiles WHERE username = ? AND deleted_at IS NULL',
      [username]
    );

    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Ottenere profilo corrente (opzionale per guest)
    const currentProfile = await getCurrentProfile();

    // 3. Se il profilo è privato, verificare che l'utente corrente possa vedere
    if (targetProfile.is_private && (!currentProfile || currentProfile.id !== targetProfile.id)) {
      // Verificare se segue
      const isFollowing = await queryOne(
        'SELECT 1 FROM follows WHERE follower_profile_id = ? AND following_profile_id = ? AND status = "accepted" AND deleted_at IS NULL',
        [currentProfile?.id, targetProfile.id]
      );

      if (!isFollowing) {
        return NextResponse.json({ error: 'Cannot view followers of private profile' }, { status: 403 });
      }
    }

    // 4. Query followers
    const followers = await queryAll(`
      SELECT
        p.id,
        p.username,
        p.full_name,
        p.profile_image_url,
        p.is_verified,
        EXISTS(
          SELECT 1 FROM follows f2
          WHERE f2.follower_profile_id = ?
          AND f2.following_profile_id = p.id
          AND f2.status = 'accepted'
          AND f2.deleted_at IS NULL
        ) as is_following,
        EXISTS(
          SELECT 1 FROM follows f3
          WHERE f3.follower_profile_id = p.id
          AND f3.following_profile_id = ?
          AND f3.status = 'accepted'
          AND f3.deleted_at IS NULL
        ) as follows_you
      FROM follows f
      INNER JOIN profiles p ON p.id = f.follower_profile_id
      WHERE f.following_profile_id = ?
      AND f.status = 'accepted'
      AND f.deleted_at IS NULL
      AND p.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `, [currentProfile?.id || 0, currentProfile?.id || 0, targetProfile.id]);

    // Convert SQLite numeric fields to proper types
    const formattedFollowers = followers.map((follower: any) => ({
      ...follower,
      is_verified: Boolean(follower.is_verified),
    }));

    return NextResponse.json({ followers: formattedFollowers });
  } catch (error) {
    console.error('Error fetching followers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
