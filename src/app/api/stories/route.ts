import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

// GET /api/stories
// Returns active stories for the current user: own stories + stories from followed profiles
export async function GET() {
  try {
    const currentProfile = await getCurrentProfile();

    // If not authenticated, return public recent stories (limit 20)
    const profileCondition = currentProfile
      ? `(
          s.profile_id IN (
            SELECT following_profile_id FROM follows WHERE follower_profile_id = ${currentProfile.id} AND deleted_at IS NULL AND status = 'accepted'
          )
          OR s.profile_id = ${currentProfile.id}
        )`
      : '1=1';

    const sql = `
      SELECT
        s.id,
        s.profile_id,
        p.username,
        p.profile_image_url,
        s.media_url,
        s.media_type,
        s.duration_seconds,
        s.views_count,
        s.created_at,
        s.expires_at
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE ${profileCondition}
        AND s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
      ORDER BY s.created_at DESC
      LIMIT 200
    `;

    const rows = await queryAll(sql);

    return NextResponse.json({ stories: rows });
  } catch (error) {
    console.error('[api/stories] GET error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
