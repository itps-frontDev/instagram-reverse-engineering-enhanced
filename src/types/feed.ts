/**
 * @fileoverview Feed types
 *
 * Type definitions for feed posts, likes, comments, and related data.
 */

// ============================================================================
// POST TYPES
// ============================================================================

export interface FeedPost {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;

  // Joined data from profiles table
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  profile_has_active_story: boolean;
  profile_has_viewed_story: boolean;
  profile_is_private: boolean;

  // Media (first image/video)
  media: PostMedia[];

  // Current user interaction
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
  is_following_author: boolean;
}

export interface PostMedia {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
}

/**
 * Reel (video post) con tutti i dettagli per il feed.
 * Simile a FeedPost ma specifico per contenuti video.
 */
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
  media: PostMedia[];
}

export interface Comment {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  text: string;
  likes_count: number;
  created_at: string;

  // Joined data
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  profile_has_active_story: boolean;
  profile_has_viewed_story: boolean;
  profile_is_private: boolean;

  // Current user interaction
  is_liked_by_current_user: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface GetFeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Risposta API per GET /api/reels.
 */
export interface GetReelsResponse {
  reels: Reel[];
  hasMore: boolean;
  total: number;
}

export interface LikePostRequest {
  postId: number;
}

export interface LikePostResponse {
  success: boolean;
  liked: boolean;
  likes_count: number;
}

export interface SavePostRequest {
  postId: number;
}

export interface SavePostResponse {
  success: boolean;
  saved: boolean;
}

export interface CreateCommentRequest {
  postId: number;
  text: string;
  parentId?: number;
}

export interface CreateCommentResponse {
  success: boolean;
  comment: Comment;
}

export interface GetCommentsRequest {
  postId: number;
  limit?: number;
  offset?: number;
}

export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}
