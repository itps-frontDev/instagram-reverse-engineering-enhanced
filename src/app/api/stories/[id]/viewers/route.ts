import { NextResponse, NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll, queryOne } from '@/lib/db';

// GET /api/stories/[id]/viewers
// Get list of users who viewed this story
// Only accessible by the story owner
export async function GET(
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

    const storyId = parseInt(id, 10);

    if (!storyId) {
      return NextResponse.json(
        { error: 'Invalid story ID' },
        { status: 400 }
      );
    }

    // Verify story exists and belongs to current user
    const story = await queryOne<{ id: number; profile_id: number }>(
      `SELECT id, profile_id FROM stories WHERE id = ? AND profile_id = ?`,
      [storyId, currentProfile.id]
    );

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found or not owned by you' },
        { status: 404 }
      );
    }

    // Get all viewers
    const viewers = await queryAll<{
      id: number;
      username: string;
      profile_image_url: string | null;
      viewed_at: string;
    }>(
      `SELECT 
        p.id,
        p.username,
        p.profile_image_url,
        sv.viewed_at
       FROM story_views sv
       JOIN profiles p ON p.id = sv.viewer_profile_id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );

    return NextResponse.json({
      viewers,
      total_views: viewers.length,
    });
  } catch (error) {
    console.error('[api/stories/[id]/viewers] GET error', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
