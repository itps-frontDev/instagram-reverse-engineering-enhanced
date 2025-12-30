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

    // Only show stories from followed profiles (not own stories)
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
      WHERE s.profile_id IN (
        SELECT following_profile_id FROM follows 
        WHERE follower_profile_id = ? 
          AND status = 'accepted'
      )
        AND s.expires_at > datetime('now')
      ORDER BY s.created_at DESC
      LIMIT 200
    `;

    const rows = await queryAll(sql, [currentProfile.id]);

    return NextResponse.json({ stories: rows });
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
         )`,
      [story_id, currentProfile.id, currentProfile.id]
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

