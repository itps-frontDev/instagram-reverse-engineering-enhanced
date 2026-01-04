/**
 * @fileoverview Save a post
 * POST /api/posts/[postId]/save
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

    // Check if already saved
    const existing = await queryAll<{ id: number }>(
      `SELECT id FROM saved_posts 
       WHERE profile_id = ? 
       AND post_id = ? 
       AND deleted_at IS NULL`,
      [profileId, postIdNum]
    );

    if (existing.length > 0) {
      return NextResponse.json({ message: 'Already saved' });
    }

    // Insert saved post
    await execute(
      `INSERT INTO saved_posts (profile_id, post_id) 
       VALUES (?, ?)`,
      [profileId, postIdNum]
    );

    return NextResponse.json({ message: 'Post saved successfully' });
  } catch (error) {
    console.error('Error saving post:', error);
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 });
  }
}
