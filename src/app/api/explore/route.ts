/**
 * @fileoverview Explore API endpoint
 *
 * GET /api/explore
 * Returns popular posts from public profiles for the explore page
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
  is_liked: number | null;
  is_saved: number | null;
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
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query per post popolari da profili pubblici
    // Esclude i propri post e usa RANDOM() per mischiare video e immagini
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
        (SELECT 1 FROM likes
         WHERE likeable_type = 'post'
         AND likeable_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts
         WHERE post_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND pr.is_private = 0
        AND p.profile_id != ?
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfile.id, currentProfile.id, currentProfile.id, limit + 1, offset]
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
      media: mediaByPost.get(post.id) || [],
      is_liked_by_current_user: Boolean(post.is_liked),
      is_saved_by_current_user: Boolean(post.is_saved),
    }));

    const response: GetFeedResponse = {
      posts: feedPosts,
      nextCursor: hasMore ? (offset + limit).toString() : null,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Explore API] Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
