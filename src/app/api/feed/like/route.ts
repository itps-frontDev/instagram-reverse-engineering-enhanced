/**
 * @fileoverview Like/Unlike post API endpoint
 *
 * POST /api/feed/like
 * Toggles like on a post (like if not liked, unlike if already liked)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import type { LikePostRequest, LikePostResponse } from '@/lib/types/feed';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: LikePostRequest = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await queryOne<{ id: number; likes_count: number }>(
      'SELECT id, likes_count FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM likes
       WHERE profile_id = ?
         AND likeable_type = 'post'
         AND likeable_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentProfile.id, postId]
    );

    let liked: boolean;
    let newLikesCount: number;

    if (existingLike && !existingLike.deleted_at) {
      // Unlike: soft delete the like
      await execute(
        `UPDATE likes
         SET deleted_at = datetime('now')
         WHERE id = ?`,
        [existingLike.id]
      );

      // Decrement likes_count
      await execute(
        `UPDATE posts
         SET likes_count = MAX(0, likes_count - 1)
         WHERE id = ?`,
        [postId]
      );

      liked = false;
      newLikesCount = Math.max(0, post.likes_count - 1);
    } else if (existingLike && existingLike.deleted_at) {
      // Re-like: restore the like
      await execute(
        `UPDATE likes
         SET deleted_at = NULL
         WHERE id = ?`,
        [existingLike.id]
      );

      // Increment likes_count
      await execute(
        `UPDATE posts
         SET likes_count = likes_count + 1
         WHERE id = ?`,
        [postId]
      );

      liked = true;
      newLikesCount = post.likes_count + 1;
    } else {
      // Create new like
      await execute(
        `INSERT INTO likes (profile_id, likeable_type, likeable_id)
         VALUES (?, 'post', ?)`,
        [currentProfile.id, postId]
      );

      // Increment likes_count
      await execute(
        `UPDATE posts
         SET likes_count = likes_count + 1
         WHERE id = ?`,
        [postId]
      );

      liked = true;
      newLikesCount = post.likes_count + 1;
    }

    const response: LikePostResponse = {
      success: true,
      liked,
      likes_count: newLikesCount,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Like] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
