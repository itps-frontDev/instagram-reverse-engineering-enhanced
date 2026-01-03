/**
 * @fileoverview Like/Unlike comment API endpoint
 *
 * POST /api/feed/comments/like
 * Toggles like on a comment (like if not liked, unlike if already liked)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';

export const runtime = 'nodejs';

interface LikeCommentRequest {
  commentId: number;
}

interface LikeCommentResponse {
  success: boolean;
  liked: boolean;
  likes_count: number;
}

export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: LikeCommentRequest = await request.json();
    const { commentId } = body;

    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 }
      );
    }

    // Check if comment exists
    const comment = await queryOne<{ id: number; likes_count: number }>(
      'SELECT id, likes_count FROM comments WHERE id = ? AND deleted_at IS NULL',
      [commentId]
    );

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM likes
       WHERE profile_id = ?
         AND likeable_type = 'comment'
         AND likeable_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentProfile.id, commentId]
    );

    let liked: boolean;
    let newLikesCount: number;

    if (existingLike && !existingLike.deleted_at) {
      // Unlike: soft delete the like
      await execute(
        `UPDATE likes
         SET deleted_at = datetime('now', 'localtime')
         WHERE id = ?`,
        [existingLike.id]
      );

      // Decrement likes_count
      await execute(
        `UPDATE comments
         SET likes_count = MAX(0, likes_count - 1)
         WHERE id = ?`,
        [commentId]
      );

      liked = false;
      newLikesCount = Math.max(0, comment.likes_count - 1);
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
        `UPDATE comments
         SET likes_count = likes_count + 1
         WHERE id = ?`,
        [commentId]
      );

      liked = true;
      newLikesCount = comment.likes_count + 1;
    } else {
      // Create new like
      await execute(
        `INSERT INTO likes (profile_id, likeable_type, likeable_id, created_at)
         VALUES (?, 'comment', ?, datetime('now', 'localtime'))`,
        [currentProfile.id, commentId]
      );

      // Increment likes_count
      await execute(
        `UPDATE comments
         SET likes_count = likes_count + 1
         WHERE id = ?`,
        [commentId]
      );

      liked = true;
      newLikesCount = comment.likes_count + 1;
    }

    const response: LikeCommentResponse = {
      success: true,
      liked,
      likes_count: newLikesCount,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Comment Like] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
