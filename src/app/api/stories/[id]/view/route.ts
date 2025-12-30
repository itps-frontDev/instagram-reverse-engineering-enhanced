import { NextResponse, NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

// POST /api/stories/:id/view
// Record a story view and increment view count
// Only allows views for stories from followed profiles or own stories
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentProfile = await getCurrentProfile();
    
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const storyId = Number(id);
    if (Number.isNaN(storyId)) {
      return NextResponse.json(
        { error: 'Invalid story id' },
        { status: 400 }
      );
    }

    // Verify story exists, is active, and is accessible 
    // (from followed profiles or own story)
    const story = await queryOne<{
      id: number;
      profile_id: number;
      views_count: number;
    }>(
      `SELECT s.id, s.profile_id, s.views_count FROM stories s
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
      [storyId, currentProfile.id, currentProfile.id]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or not accessible' },
        { status: 404 }
      );
    }

    // Check if already viewed by this user
    const alreadyViewed = await queryOne(
      `SELECT id FROM story_views 
       WHERE story_id = ? AND viewer_profile_id = ?`,
      [storyId, currentProfile.id]
    );

    // Only increment views if this is the first view
    if (!alreadyViewed) {
      await execute(
        `INSERT INTO story_views (story_id, viewer_profile_id, viewed_at)
         VALUES (?, ?, datetime('now'))`,
        [storyId, currentProfile.id]
      );

      // Increment views_count on stories
      await execute(
        `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
        [storyId]
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Story view recorded',
    });
  } catch (error) {
    console.error('[api/stories/[id]/view] POST error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
