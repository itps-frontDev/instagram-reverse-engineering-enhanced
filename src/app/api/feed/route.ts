/**
 * @fileoverview Feed API endpoint
 *
 * GET /api/feed
 * Returns posts from followed users + explore (public profiles)
 * Implements Instagram-like feed algorithm
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';
import type { FeedPost, GetFeedResponse } from '@/lib/types/feed';

export const runtime = 'nodejs';

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
  profile_has_active_story: number;
  is_liked: number | null;
  is_saved: number | null;
  is_following: number | null;
}

interface MediaRow {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Complex query: Posts from followed users + Explore (public profiles)
    // Ordered by created_at DESC
    const posts = await queryAll<PostRow>(
      `SELECT DISTINCT
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
        pr.is_verified as profile_is_verified,
        (SELECT CASE 
          WHEN COUNT(*) > 0 AND EXISTS (
            SELECT 1 FROM stories s2
            WHERE s2.profile_id = p.profile_id
            AND s2.deleted_at IS NULL
            AND s2.expires_at > datetime('now')
            AND (
              s2.profile_id = ? OR
              s2.profile_id IN (
                SELECT following_profile_id FROM follows
                WHERE follower_profile_id = ?
                AND status = 'accepted'
              ) OR
              pr.is_private = 0
            )
            AND NOT EXISTS (
              SELECT 1 FROM story_views sv
              WHERE sv.story_id = s2.id
              AND sv.viewer_profile_id = ?
            )
          ) THEN 1 ELSE 0 END
         FROM stories s
         WHERE s.profile_id = p.profile_id
         AND s.deleted_at IS NULL
         AND s.expires_at > datetime('now')
        ) as profile_has_active_story,
        (SELECT 1 FROM likes
         WHERE likeable_type = 'post'
         AND likeable_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts
         WHERE post_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved,
        (SELECT 1 FROM follows
         WHERE follower_profile_id = ?
         AND following_profile_id = p.profile_id
         AND status = 'accepted'
         AND deleted_at IS NULL) as is_following
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND (
          -- Only the most recent post from the current user
          (p.profile_id = ? AND p.id = (
            SELECT id FROM posts 
            WHERE profile_id = ? 
            AND deleted_at IS NULL 
            ORDER BY created_at DESC 
            LIMIT 1
          ))
          -- OR posts from users the current user follows
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_profile_id = ?
              AND f.following_profile_id = p.profile_id
              AND f.status = 'accepted'
              AND f.deleted_at IS NULL
          )
          -- OR posts from public profiles (Explore), excluding own posts
          OR (pr.is_private = 0 AND p.profile_id != ?)
        )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [
        currentProfile.id, // for own stories in story check
        currentProfile.id, // for follows in story check
        currentProfile.id, // for story_views check
        currentProfile.id, // for is_liked
        currentProfile.id, // for is_saved
        currentProfile.id, // for is_following
        currentProfile.id, // for own post check
        currentProfile.id, // for own post subquery
        currentProfile.id, // for follows check
        currentProfile.id, // for public profiles exclude own
        limit + 1, 
        offset
      ]
    );

    // Check if there are more posts
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // Get media for all posts
    const postIds = postsToReturn.map((p) => p.id);
    let mediaByPost: Map<number, MediaRow[]> = new Map();

    if (postIds.length > 0) {
      const placeholders = postIds.map(() => '?').join(',');
      const media = await queryAll<MediaRow>(
        `SELECT id, post_id, media_url, media_type, duration_seconds, position
         FROM post_media
         WHERE post_id IN (${placeholders})
           AND deleted_at IS NULL
         ORDER BY post_id, position`,
        postIds
      );

      // Group media by post_id
      media.forEach((m) => {
        if (!mediaByPost.has(m.post_id)) {
          mediaByPost.set(m.post_id, []);
        }
        mediaByPost.get(m.post_id)!.push(m);
      });
    }

    // Transform to FeedPost format
    const feedPosts: FeedPost[] = postsToReturn.map((post) => ({
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
      profile_has_active_story: Boolean(post.profile_has_active_story),
      media: mediaByPost.get(post.id) || [],
      is_liked_by_current_user: Boolean(post.is_liked),
      is_saved_by_current_user: Boolean(post.is_saved),
      is_following_author: Boolean(post.is_following),
    }));

    const response: GetFeedResponse = {
      posts: feedPosts,
      nextCursor: hasMore ? String(offset + limit) : null,
      hasMore,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Feed] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
