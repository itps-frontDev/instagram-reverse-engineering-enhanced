/**
 * @fileoverview API route for fetching post tags
 *
 * Returns all tagged users for a specific post with their positions
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';

interface PostTag {
  id: number;
  post_id: number;
  post_media_id: number | null;
  tagged_profile_id: number;
  tagged_username: string;
  x_position: number;
  y_position: number;
  created_at: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: postIdStr } = await params;
    const postId = parseInt(postIdStr);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // Get all tags for this post with tagged user info
    const tags = await queryAll<PostTag>(
      `SELECT 
        pt.id,
        pt.post_id,
        pt.post_media_id,
        pt.tagged_profile_id,
        p.username as tagged_username,
        pt.x_position,
        pt.y_position,
        pt.created_at
      FROM post_tags pt
      JOIN profiles p ON pt.tagged_profile_id = p.id
      WHERE pt.post_id = ?
      ORDER BY pt.created_at ASC`,
      [postId]
    );

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('Error fetching post tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}
