/**
 * @fileoverview Comment on a post
 * POST /api/posts/[postId]/comment
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
    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
    }

    // Insert comment
    await execute(
      `INSERT INTO comments (post_id, profile_id, text) 
       VALUES (?, ?, ?)`,
      [postIdNum, profileId, text.trim()]
    );

    // Update post comments_count
    await execute(
      `UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?`,
      [postIdNum]
    );

    return NextResponse.json({ message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
