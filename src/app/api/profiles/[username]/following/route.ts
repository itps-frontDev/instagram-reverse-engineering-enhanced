/**
 * @fileoverview API endpoint for fetching profiles that user follows
 *
 * GET /api/profiles/[username]/following
 * - Returns list of users that the profile follows
 * - Respects privacy settings (private profiles)
 * - Includes follow status for each user
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
        return NextResponse.json({ error: 'Cannot view following of private profile' }, { status: 403 });
      }
    }

    // 4. Query following (invertita rispetto a followers)
    const following = await queryAll(`
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
      INNER JOIN profiles p ON p.id = f.following_profile_id
      WHERE f.follower_profile_id = ?
      AND f.status = 'accepted'
      AND f.deleted_at IS NULL
      AND p.deleted_at IS NULL
      ORDER BY f.created_at DESC
    `, [currentProfile?.id || 0, currentProfile?.id || 0, targetProfile.id]);

    return NextResponse.json({ following });
  } catch (error) {
    console.error('Error fetching following:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
