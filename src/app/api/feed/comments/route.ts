/**
 * @fileoverview Comments API endpoint
 *
 * GET /api/feed/comments?postId=123&limit=20&offset=0
 * Returns comments for a post
 *
 * POST /api/feed/comments
 * Creates a new comment on a post
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryAll, queryOne } from '@/lib/db';
import type {
  Comment,
  CreateCommentRequest,
  CreateCommentResponse,
  GetCommentsResponse,
} from '@/lib/types/feed';

export const runtime = 'nodejs';

interface CommentRow {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  text: string;
  likes_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: number;
  profile_has_active_story: number;
  profile_is_private: number;
  is_liked: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const postId = parseInt(searchParams.get('postId') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await queryOne<{ id: number; comments_count: number }>(
      'SELECT id, comments_count FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get comments (all comments including replies, ordered by created_at DESC)
    const commentsRows = await queryAll<CommentRow>(
      `SELECT
        c.id,
        c.post_id,
        c.profile_id,
        c.parent_id,
        c.text,
        c.likes_count,
        c.created_at,
        p.username as profile_username,
        p.full_name as profile_full_name,
        p.profile_image_url,
        p.is_verified as profile_is_verified,
        p.is_private as profile_is_private,
        (
          SELECT CASE 
            WHEN COUNT(*) > 0 AND EXISTS (
              SELECT 1 FROM stories s2
              WHERE s2.profile_id = p.id
              AND s2.deleted_at IS NULL
              AND s2.expires_at > datetime('now')
              AND (
                s2.profile_id = ? OR
                s2.profile_id IN (
                  SELECT following_profile_id FROM follows
                  WHERE follower_profile_id = ?
                  AND status = 'accepted'
                ) OR
                p.is_private = 0
              )
              AND NOT EXISTS (
                SELECT 1 FROM story_views sv
                WHERE sv.story_id = s2.id
                AND sv.viewer_profile_id = ?
              )
            ) THEN 1 ELSE 0 END
          FROM stories s
          WHERE s.profile_id = p.id
            AND s.expires_at > datetime('now')
            AND s.deleted_at IS NULL
        ) as profile_has_active_story,
        (SELECT 1 FROM likes
         WHERE likeable_type = 'comment'
         AND likeable_id = c.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked
      FROM comments c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE c.post_id = ?
        AND c.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?`,
      [currentProfile.id, currentProfile.id, currentProfile.id, currentProfile.id, postId, limit + 1, offset]
    );

    const hasMore = commentsRows.length > limit;
    const commentsToReturn = hasMore ? commentsRows.slice(0, limit) : commentsRows;

    const comments: Comment[] = commentsToReturn.map((c) => ({
      id: c.id,
      post_id: c.post_id,
      profile_id: c.profile_id,
      parent_id: c.parent_id,
      text: c.text,
      likes_count: c.likes_count,
      created_at: c.created_at,
      profile_username: c.profile_username,
      profile_full_name: c.profile_full_name,
      profile_image_url: c.profile_image_url,
      profile_is_verified: Boolean(c.profile_is_verified),
      profile_has_active_story: Boolean(c.profile_has_active_story),
      profile_is_private: Boolean(c.profile_is_private),
      is_liked_by_current_user: Boolean(c.is_liked),
    }));

    const response: GetCommentsResponse = {
      comments,
      total: post.comments_count,
      hasMore,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Comments GET] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
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

    const body: CreateCommentRequest = await request.json();
    const { postId, text, parentId } = body;

    if (!postId || !text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'postId and text are required' },
        { status: 400 }
      );
    }

    // Check if post exists and is not comments disabled
    const post = await queryOne<{ id: number; is_comments_disabled: number }>(
      'SELECT id, is_comments_disabled FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.is_comments_disabled) {
      return NextResponse.json(
        { error: 'Comments are disabled for this post' },
        { status: 403 }
      );
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await queryOne<{ id: number }>(
        `SELECT id FROM comments
         WHERE id = ? AND post_id = ? AND deleted_at IS NULL`,
        [parentId, postId]
      );

      if (!parentComment) {
        return NextResponse.json(
          { error: 'Parent comment not found' },
          { status: 404 }
        );
      }
    }

    // Create comment with local timezone
    const result = await execute(
      `INSERT INTO comments (post_id, profile_id, parent_id, text, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [postId, currentProfile.id, parentId || null, text.trim()]
    );

    // Increment comments_count (only for top-level comments)
    if (!parentId) {
      await execute(
        `UPDATE posts
         SET comments_count = comments_count + 1
         WHERE id = ?`,
        [postId]
      );
    }

    // Get post owner to send notification
    const postOwner = await queryOne<{ profile_id: number }>(
      `SELECT profile_id FROM posts WHERE id = ?`,
      [postId]
    );

    // Create notification (only if not commenting on own post)
    if (postOwner && postOwner.profile_id !== currentProfile.id) {
      await execute(
        `INSERT INTO notifications (recipient_profile_id, sender_profile_id, type, reference_type, reference_id)
         VALUES (?, ?, 'comment', 'post', ?)`,
        [postOwner.profile_id, currentProfile.id, postId]
      );
    }

    // Fetch the created comment with profile data
    const commentRow = await queryOne<CommentRow>(
      `SELECT
        c.id,
        c.post_id,
        c.profile_id,
        c.parent_id,
        c.text,
        c.likes_count,
        c.created_at,
        p.username as profile_username,
        p.full_name as profile_full_name,
        p.profile_image_url,
        p.is_verified as profile_is_verified,
        p.is_private as profile_is_private,
        0 as is_liked,
        0 as profile_has_active_story
      FROM comments c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE c.id = ?`,
      [result.lastID]
    );

    if (!commentRow) {
      throw new Error('Failed to fetch created comment');
    }

    const comment: Comment = {
      id: commentRow.id,
      post_id: commentRow.post_id,
      profile_id: commentRow.profile_id,
      parent_id: commentRow.parent_id,
      text: commentRow.text,
      likes_count: commentRow.likes_count,
      created_at: commentRow.created_at,
      profile_username: commentRow.profile_username,
      profile_full_name: commentRow.profile_full_name,
      profile_image_url: commentRow.profile_image_url,
      profile_is_verified: Boolean(commentRow.profile_is_verified),
      profile_is_private: Boolean(commentRow.profile_is_private),
      is_liked_by_current_user: false,
      profile_has_active_story: false,
    };

    const response: CreateCommentResponse = {
      success: true,
      comment,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Comments POST] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
