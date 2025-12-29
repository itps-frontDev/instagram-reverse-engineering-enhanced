import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

// POST /api/stories/:id/view
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storyId = Number(params.id);
    if (Number.isNaN(storyId)) {
      return NextResponse.json({ error: 'Invalid story id' }, { status: 400 });
    }

    // Check story exists and is active
    const story = await queryOne(`SELECT id, profile_id, expires_at FROM stories WHERE id = ? AND deleted_at IS NULL`, [storyId]);
    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // mark view if not already viewed
    const already = await queryOne(`SELECT id FROM story_views WHERE story_id = ? AND viewer_profile_id = ?`, [storyId, currentProfile.id]);
    if (!already) {
      await execute(`INSERT INTO story_views (story_id, viewer_profile_id) VALUES (?, ?)`, [storyId, currentProfile.id]);
      // increment views_count on stories
      await execute(`UPDATE stories SET views_count = views_count + 1 WHERE id = ?`, [storyId]);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/stories/[id]/view] POST error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
