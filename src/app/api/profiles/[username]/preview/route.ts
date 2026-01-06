/**
 * @fileoverview API endpoint for profile preview
 * 
 * GET /api/profiles/[username]/preview
 * Returns profile info with recent posts for hover preview card
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne, queryAll } from '@/lib/db';

interface Profile {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
}

interface Post {
  id: number;
  media_url: string;
  media_type: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await params;

    // Get profile info
    const profile = await queryOne<Profile>(
      `SELECT id, username, full_name, bio, profile_image_url, is_verified, is_private
       FROM profiles
       WHERE username = ? AND deleted_at IS NULL`,
      [username]
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get counts
    const postsCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM posts WHERE profile_id = ? AND deleted_at IS NULL`,
      [profile.id]
    );

    const followersCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM follows WHERE following_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'`,
      [profile.id]
    );

    const followingCount = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM follows WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'`,
      [profile.id]
    );

    // Check if current user follows this profile
    const currentUserProfile = await queryOne<{ id: number }>(
      `SELECT id FROM profiles WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    const isFollowing = currentUserProfile ? await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM follows 
       WHERE follower_profile_id = ? AND following_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'`,
      [currentUserProfile.id, profile.id]
    ) : null;

    // Get recent posts only if profile is public OR user is following
    const canViewPosts = !profile.is_private || (isFollowing && isFollowing.count > 0);
    const recentPosts = canViewPosts ? await queryAll<Post>(
      `SELECT p.id, pm.media_url, pm.media_type
       FROM posts p
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0
       WHERE p.profile_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT 3`,
      [profile.id]
    ) : [];

    return NextResponse.json({
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      bio: profile.bio,
      profile_image_url: profile.profile_image_url,
      is_verified: profile.is_verified,
      is_private: profile.is_private,
      posts_count: postsCount?.count || 0,
      followers_count: followersCount?.count || 0,
      following_count: followingCount?.count || 0,
      recent_posts: recentPosts,
    });
  } catch (error) {
    console.error('[Profile Preview] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
