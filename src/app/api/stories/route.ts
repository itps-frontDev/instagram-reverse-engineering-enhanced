import { NextResponse, NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll, queryOne, execute } from '@/lib/db';

export const runtime = 'nodejs';

// GET /api/stories
// Returns active stories for the current user: own stories + stories from followed profiles
export async function GET() {
  try {
    const currentProfile = await getCurrentProfile();

    // If not authenticated, return empty list
    if (!currentProfile) {
      return NextResponse.json({ stories: [] });
    }

    // Show stories from followed profiles (accepted), own stories, OR public profiles
    const sql = `
      SELECT
        s.id,
        s.profile_id,
        p.username,
        p.profile_image_url,
        p.is_verified,
        s.media_url,
        s.media_type,
        s.duration_seconds,
        s.views_count,
        s.created_at,
        s.expires_at,
        CASE WHEN EXISTS (
          SELECT 1 FROM likes 
          WHERE profile_id = ? 
            AND likeable_type = 'story' 
            AND likeable_id = s.id 
            AND deleted_at IS NULL
        ) THEN 1 ELSE 0 END as is_liked_by_me
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE (
        s.profile_id IN (
          SELECT following_profile_id FROM follows 
          WHERE follower_profile_id = ? 
            AND status = 'accepted'
            AND deleted_at IS NULL
        )
        OR s.profile_id = ?
        OR (p.is_private = 0)
      )
        AND s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
      ORDER BY s.created_at DESC
      LIMIT 200
    `;
    /**
            WHERE follower_profile_id = ${currentProfile.id} 
          AND deleted_at IS NULL 
          AND status = 'accepted'
      )
        AND s.deleted_at IS NULL
     
     */
    const rows = await queryAll(sql, [currentProfile.id, currentProfile.id, currentProfile.id]);

    // Convert is_verified to boolean
    const stories = rows.map((story: any) => ({
      ...story,
      is_verified: Boolean(story.is_verified)
    }));

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('[api/stories] GET error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/stories
// Record a story view
export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { story_id } = await request.json();

    if (!story_id) {
      return NextResponse.json(
        { error: 'Missing story_id' },
        { status: 400 }
      );
    }

    // Verify story exists and is accessible
    const story = await queryOne<{ id: number; profile_id: number }>(
      `SELECT s.id, s.profile_id FROM stories s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.id = ? 
         AND s.deleted_at IS NULL
         AND s.expires_at > datetime('now')
         AND (
           s.profile_id IN (
             SELECT following_profile_id FROM follows 
             WHERE follower_profile_id = ? 
               AND deleted_at IS NULL 
               AND status = 'accepted'
           )
           OR s.profile_id = ?
           OR (p.is_private = 0 AND s.profile_id != ?)
         )`,
      [story_id, currentProfile.id, currentProfile.id, currentProfile.id]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or not accessible' },
        { status: 404 }
      );
    }

    // Check if already viewed
    const existingView = await queryOne(
      `SELECT id FROM story_views 
       WHERE story_id = ? AND viewer_profile_id = ?`,
      [story_id, currentProfile.id]
    );

    if (!existingView) {
      // Record the view
      await execute(
        `INSERT INTO story_views (story_id, viewer_profile_id, viewed_at)
         VALUES (?, ?, datetime('now'))`,
        [story_id, currentProfile.id]
      );

      // Increment views count
      await execute(
        `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
        [story_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Story view recorded',
    });
  } catch (error) {
    console.error('[api/stories] POST error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

