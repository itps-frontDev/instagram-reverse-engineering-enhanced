/**
 * @fileoverview API route for getting profile posts
 *
 * This endpoint returns posts for a profile with pagination support.
 * Supports filtering by tab (posts, reels, saved, tagged).
 *
 * @module api/profiles/[username]/posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne, queryAll } from '@/lib/db';
import { Profile, Post, GetPostsResponse, ProfileTab } from '@/lib/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// CONSTANTS
// ============================================================================

const POSTS_PER_PAGE = 12; // Instagram uses 12 posts per page

// ============================================================================
// GET /api/profiles/[username]/posts
// ============================================================================

/**
 * Get posts for a profile.
 *
 * Query parameters:
 * - tab: 'posts' | 'reels' | 'saved' | 'tagged' (default: 'posts')
 * - page: number (default: 0)
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing username
 * @returns Posts array with pagination info
 *
 * @example
 * // Fetch first page of posts
 * const response = await fetch('/api/profiles/johndoe/posts?tab=posts&page=0');
 * const { posts, hasMore } = await response.json();
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const tab = (searchParams.get('tab') || 'posts') as ProfileTab;
    const page = parseInt(searchParams.get('page') || '0', 10);

    // Validate parameters
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!['posts', 'reels', 'saved', 'tagged'].includes(tab)) {
      return NextResponse.json(
        { error: 'Invalid tab parameter. Must be: posts, reels, saved, or tagged' },
        { status: 400 }
      );
    }

    if (isNaN(page) || page < 0) {
      return NextResponse.json(
        { error: 'Invalid page parameter' },
        { status: 400 }
      );
    }

    // Fetch target profile
    const targetProfile = await queryOne<Profile>(
      'SELECT id, is_private FROM profiles WHERE username = ? AND deleted_at IS NULL',
      [username]
    );

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if user can view this profile's posts
    const currentProfile = await getCurrentProfile();
    const canView = await checkCanViewPosts(
      targetProfile.id,
      Boolean(targetProfile.is_private),
      currentProfile?.id || null
    );

    if (!canView) {
      return NextResponse.json(
        { error: 'Cannot view posts from private profile' },
        { status: 403 }
      );
    }

    // Fetch posts based on tab
    const offset = page * POSTS_PER_PAGE;
    const limit = POSTS_PER_PAGE + 1; // Fetch one extra to check if there are more

    let posts: Post[] = [];

    if (tab === 'tagged') {
      // Get tagged posts
      posts = await queryAll<Post>(
        `SELECT DISTINCT
          p.id,
          p.caption,
          p.likes_count,
          p.comments_count,
          p.created_at,
          pm.media_url,
          pm.media_type,
          (SELECT COUNT(*)
           FROM post_media pm2
           WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
        FROM posts p
        INNER JOIN post_tags pt ON pt.post_id = p.id
        LEFT JOIN post_media pm
          ON pm.post_id = p.id
          AND pm.position = 0
          AND pm.deleted_at IS NULL
        WHERE pt.tagged_profile_id = ?
          AND p.deleted_at IS NULL
          AND pt.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
        [targetProfile.id, limit, offset]
      );
    } else if (tab === 'reels') {
      // Get reels (video posts)
      posts = await queryAll<Post>(
        `SELECT
          p.id,
          p.caption,
          p.likes_count,
          p.comments_count,
          p.created_at,
          pm.media_url,
          pm.media_type,
          (SELECT COUNT(*)
           FROM post_media pm2
           WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
        FROM posts p
        LEFT JOIN post_media pm
          ON pm.post_id = p.id
          AND pm.position = 0
          AND pm.deleted_at IS NULL
        WHERE p.profile_id = ?
          AND p.deleted_at IS NULL
          AND pm.media_type = 'video'
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
        [targetProfile.id, limit, offset]
      );
    } else if (tab === 'saved') {
      // Get saved posts
      // Only the profile owner can see their saved posts
      if (!currentProfile || currentProfile.id !== targetProfile.id) {
        return NextResponse.json(
          { error: 'Cannot view saved posts of other users' },
          { status: 403 }
        );
      }

      posts = await queryAll<Post>(
        `SELECT DISTINCT
          p.id,
          p.caption,
          p.likes_count,
          p.comments_count,
          p.created_at,
          pm.media_url,
          pm.media_type,
          (SELECT COUNT(*)
           FROM post_media pm2
           WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
        FROM saved_posts sp
        INNER JOIN posts p ON p.id = sp.post_id
        LEFT JOIN post_media pm
          ON pm.post_id = p.id
          AND pm.position = 0
          AND pm.deleted_at IS NULL
        WHERE sp.profile_id = ?
          AND sp.deleted_at IS NULL
          AND p.deleted_at IS NULL
        ORDER BY sp.created_at DESC
        LIMIT ? OFFSET ?`,
        [targetProfile.id, limit, offset]
      );
    } else {
      // Get regular posts (default)
      posts = await queryAll<Post>(
        `SELECT
          p.id,
          p.caption,
          p.likes_count,
          p.comments_count,
          p.created_at,
          pm.media_url,
          pm.media_type,
          (SELECT COUNT(*)
           FROM post_media pm2
           WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
        FROM posts p
        LEFT JOIN post_media pm
          ON pm.post_id = p.id
          AND pm.position = 0
          AND pm.deleted_at IS NULL
        WHERE p.profile_id = ?
          AND p.deleted_at IS NULL
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
        [targetProfile.id, limit, offset]
      );
    }

    // Check if there are more posts
    const hasMore = posts.length > POSTS_PER_PAGE;

    // Remove the extra post used for pagination check
    if (hasMore) {
      posts = posts.slice(0, POSTS_PER_PAGE);
    }

    // Return posts
    const response: GetPostsResponse = {
      posts,
      hasMore,
      total: posts.length,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching posts:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if current user can view posts from a profile.
 *
 * @param targetProfileId - The profile to check
 * @param isPrivate - Whether the profile is private
 * @param currentProfileId - The current user's profile ID (or null if not logged in)
 * @returns true if user can view posts, false otherwise
 */
async function checkCanViewPosts(
  targetProfileId: number,
  isPrivate: boolean,
  currentProfileId: number | null
): Promise<boolean> {
  // If profile is public, anyone can view
  if (!isPrivate) {
    return true;
  }

  // If not logged in, cannot view private profile
  if (!currentProfileId) {
    return false;
  }

  // If viewing own profile, can view
  if (currentProfileId === targetProfileId) {
    return true;
  }

  // Check if following with accepted status
  const follow = await queryOne<{ status: string }>(
    `SELECT status
     FROM follows
     WHERE follower_profile_id = ?
       AND following_profile_id = ?
       AND deleted_at IS NULL`,
    [currentProfileId, targetProfileId]
  );

  return follow?.status === 'accepted';
}
