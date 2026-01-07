/**
 * API Route: /api/stories/[id]/like
 * Toggle like on a story
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const storyId = parseInt(id);
  if (isNaN(storyId)) {
    return NextResponse.json({ error: 'Invalid story ID' }, { status: 400 });
  }

  // Check if story exists and is not expired
  const story = await queryOne(
    `SELECT id FROM stories 
     WHERE id = ? AND deleted_at IS NULL AND datetime('now') < datetime(expires_at)`,
    [storyId]
  );

  if (!story) {
    return NextResponse.json({ error: 'Story not found or expired' }, { status: 404 });
  }

  // Check if already liked
  const existingLike = await queryOne<{ id: number; deleted_at: string | null }>(
    `SELECT id, deleted_at FROM likes 
     WHERE profile_id = ? AND likeable_type = 'story' AND likeable_id = ?`,
    [profile.id, storyId]
  );

  if (existingLike) {
    if (existingLike.deleted_at) {
      // Re-activate the like
      await execute(
        `UPDATE likes SET deleted_at = NULL WHERE id = ?`,
        [existingLike.id]
      );
      return NextResponse.json({ liked: true });
    } else {
      // Remove the like (soft delete)
      await execute(
        `UPDATE likes SET deleted_at = datetime('now') WHERE id = ?`,
        [existingLike.id]
      );
      return NextResponse.json({ liked: false });
    }
  } else {
    // Create new like
    await execute(
      `INSERT INTO likes (profile_id, likeable_type, likeable_id) VALUES (?, 'story', ?)`,
      [profile.id, storyId]
    );
    return NextResponse.json({ liked: true });
  }
}
