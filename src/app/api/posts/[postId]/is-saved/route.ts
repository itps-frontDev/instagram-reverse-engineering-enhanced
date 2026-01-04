/**
 * @fileoverview Check if post is saved by current user
 * GET /api/posts/[postId]/is-saved
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
      return NextResponse.json({ isSaved: false });
    }

    const { postId } = await params;

    // Check if user has saved this post
    const result = await queryAll<{ id: number }>(
      `SELECT id FROM saved_posts 
       WHERE profile_id = ? 
       AND post_id = ? 
       AND deleted_at IS NULL`,
      [profileId, parseInt(postId)]
    );

    return NextResponse.json({ isSaved: result.length > 0 });
  } catch (error) {
    console.error('Error checking save status:', error);
    return NextResponse.json({ isSaved: false });
  }
}
