/**
 * @fileoverview Unsave a post
 * POST /api/posts/[postId]/unsave
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

    // Soft delete saved post
    await execute(
      `UPDATE saved_posts 
       SET deleted_at = datetime('now') 
       WHERE profile_id = ? 
       AND post_id = ? 
       AND deleted_at IS NULL`,
      [profileId, postIdNum]
    );

    return NextResponse.json({ message: 'Post unsaved successfully' });
  } catch (error) {
    console.error('Error unsaving post:', error);
    return NextResponse.json({ error: 'Failed to unsave post' }, { status: 500 });
  }
}
