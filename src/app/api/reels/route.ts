/**
 * @fileoverview Reels API endpoint
 *
 * GET /api/reels
 * Returns video posts (reels) for the reels feed
 * Implements infinite scroll with random ordering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export const runtime = 'nodejs';

interface ReelRow {
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

export interface Reel {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
  media: {
    id: number;
    media_url: string;
    media_type: 'image' | 'video';
    duration_seconds: number | null;
    position: number;
  }[];
}

export interface GetReelsResponse {
  reels: Reel[];
  hasMore: boolean;
  total: number;
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Query only video posts (reels)
    const reels = await queryAll<ReelRow>(
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
      INNER JOIN post_media pm ON pm.post_id = p.id AND pm.media_type = 'video'
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND pm.deleted_at IS NULL
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfile.id, currentProfile.id, limit, offset]
    );

    // Get total count of reels
    const countResult = await queryAll<{ count: number }>(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM posts p
       INNER JOIN profiles pr ON p.profile_id = pr.id
       INNER JOIN post_media pm ON pm.post_id = p.id AND pm.media_type = 'video'
       WHERE p.deleted_at IS NULL
         AND pr.deleted_at IS NULL
         AND pm.deleted_at IS NULL`
    );
    const total = countResult[0]?.count || 0;

    // Get media for all reels
    const reelIds = reels.map(r => r.id);
    let mediaMap = new Map<number, MediaRow[]>();

    if (reelIds.length > 0) {
      const media = await queryAll<MediaRow>(
        `SELECT id, post_id, media_url, media_type, duration_seconds, position
         FROM post_media
         WHERE post_id IN (${reelIds.join(',')})
           AND deleted_at IS NULL
         ORDER BY post_id, position`
      );

      for (const m of media) {
        if (!mediaMap.has(m.post_id)) {
          mediaMap.set(m.post_id, []);
        }
        mediaMap.get(m.post_id)!.push(m);
      }
    }

    // Transform to response format
    const formattedReels: Reel[] = reels.map(reel => ({
      id: reel.id,
      profile_id: reel.profile_id,
      caption: reel.caption,
      location: reel.location,
      is_comments_disabled: Boolean(reel.is_comments_disabled),
      is_likes_hidden: Boolean(reel.is_likes_hidden),
      likes_count: reel.likes_count,
      comments_count: reel.comments_count,
      created_at: reel.created_at,
      profile_username: reel.profile_username,
      profile_full_name: reel.profile_full_name,
      profile_image_url: reel.profile_image_url,
      profile_is_verified: Boolean(reel.profile_is_verified),
      is_liked_by_current_user: Boolean(reel.is_liked),
      is_saved_by_current_user: Boolean(reel.is_saved),
      media: (mediaMap.get(reel.id) || []).map(m => ({
        id: m.id,
        media_url: m.media_url,
        media_type: m.media_type,
        duration_seconds: m.duration_seconds,
        position: m.position,
      })),
    }));

    const response: GetReelsResponse = {
      reels: formattedReels,
      hasMore: offset + reels.length < total,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}
