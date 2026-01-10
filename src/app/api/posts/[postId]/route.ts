/**
 * @fileoverview API route for getting a single post with all media
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';
import type { FeedPost } from '@/lib/types/feed';
import { getCurrentProfileId } from '@/lib/auth';

interface PostRow {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: number;
  is_likes_hidden: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: number;
}

interface MediaRow {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
}

interface LikeStatusRow {
  id: number;
}

interface SaveStatusRow {
  id: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum)) {
      return NextResponse.json({ error: 'Invalid post ID' }, { status: 400 });
    }

    // Fetch post
    const post = await queryOne<PostRow>(
      `SELECT 
        p.id,
        p.profile_id,
        p.caption,
        p.location,
        p.is_comments_disabled,
        p.is_likes_hidden,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified
      FROM posts p
      INNER JOIN profiles pr ON pr.id = p.profile_id
      WHERE p.id = ? AND p.deleted_at IS NULL`,
      [postIdNum]
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Fetch all media for this post
    const media = await queryAll<MediaRow>(
      `SELECT 
        id,
        post_id,
        media_url,
        media_type,
        duration_seconds,
        position
      FROM post_media
      WHERE post_id = ? AND deleted_at IS NULL
      ORDER BY position ASC`,
      [postIdNum]
    );

    // Check if current user has liked and saved this post
    const currentProfileId = await getCurrentProfileId();
    let isLiked = false;
    let isSaved = false;

    if (currentProfileId) {
      const [likeResult, saveResult] = await Promise.all([
        queryAll<LikeStatusRow>(
          `SELECT id FROM likes 
           WHERE profile_id = ? 
           AND likeable_type = 'post' 
           AND likeable_id = ? 
           AND deleted_at IS NULL`,
          [currentProfileId, postIdNum]
        ),
        queryAll<SaveStatusRow>(
          `SELECT id FROM saved_posts 
           WHERE profile_id = ? 
           AND post_id = ? 
           AND deleted_at IS NULL`,
          [currentProfileId, postIdNum]
        )
      ]);

      isLiked = likeResult.length > 0;
      isSaved = saveResult.length > 0;
    }

    // Build FeedPost response
    const feedPost: FeedPost = {
      id: post.id,
      profile_id: post.profile_id,
      caption: post.caption,
      location: post.location,
      is_comments_disabled: Boolean(post.is_comments_disabled),
      is_likes_hidden: Boolean(post.is_likes_hidden),
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      profile_username: post.profile_username,
      profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url,
      profile_is_verified: Boolean(post.profile_is_verified),
      media: media,
      is_liked_by_current_user: isLiked,
      is_saved_by_current_user: isSaved,
    };

    return NextResponse.json({ post: feedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
