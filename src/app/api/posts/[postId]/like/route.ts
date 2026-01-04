/**
 * @fileoverview Like a post
 * POST /api/posts/[postId]/like
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { execute, queryAll } from '@/lib/db';

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

    // Check if already liked
    const existing = await queryAll<{ id: number }>(
      `SELECT id FROM likes 
       WHERE profile_id = ? 
       AND likeable_type = 'post' 
       AND likeable_id = ? 
       AND deleted_at IS NULL`,
      [profileId, postIdNum]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already liked' });
    }

    // Insert like
    await execute(
      `INSERT INTO likes (profile_id, likeable_type, likeable_id) 
       VALUES (?, 'post', ?)`,
      [profileId, postIdNum]
    );

    // Update post likes_count
    await execute(
      `UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?`,
      [postIdNum]
    );

    return NextResponse.json({ message: 'Post liked successfully' });
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 });
  }
}
