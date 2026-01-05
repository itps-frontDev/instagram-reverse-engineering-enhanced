/**
 * @fileoverview Unlike a post
 * POST /api/posts/[postId]/unlike
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { execute } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verify authentication
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const postIdNum = parseInt(postId);

    // Soft delete like
    await execute(
      `UPDATE likes 
       SET deleted_at = datetime('now') 
       WHERE profile_id = ? 
       AND likeable_type = 'post' 
       AND likeable_id = ? 
       AND deleted_at IS NULL`,
      [profileId, postIdNum]
    );

    // Update post likes_count
    await execute(
      `UPDATE posts 
       SET likes_count = CASE 
         WHEN likes_count > 0 THEN likes_count - 1 
         ELSE 0 
       END 
       WHERE id = ?`,
      [postIdNum]
    );

    return NextResponse.json({ message: 'Post unliked successfully' });
  } catch (error) {
    console.error('Error unliking post:', error);
    return NextResponse.json({ error: 'Failed to unlike post' }, { status: 500 });
  }
}
