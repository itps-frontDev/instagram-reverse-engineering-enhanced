/**
 * @fileoverview Check if post is liked by current user
 * GET /api/posts/[postId]/is-liked
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verify authentication
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json({ isLiked: false });
    }

    const { postId } = await params;

    // Check if user has liked this post
    const result = await queryAll<{ id: number }>(
      `SELECT id FROM likes 
       WHERE profile_id = ? 
       AND likeable_type = 'post' 
       AND likeable_id = ? 
       AND deleted_at IS NULL`,
      [profileId, parseInt(postId)]
    );

    return NextResponse.json({ isLiked: result.length > 0 });
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json({ isLiked: false });
  }
}
