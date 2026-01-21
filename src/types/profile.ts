/**
 * @fileoverview Type definitions for Instagram profile features
 *
 * This file contains all TypeScript interfaces and types used across
 * profile pages, API routes, and components.
 */

// ============================================================================
// CORE PROFILE TYPES
// ============================================================================

/**
 * Profile information from the profiles table
 */
export interface Profile {
  id: number;
  user_id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  bio: string | null;
  website_url: string | null;
  is_private: boolean;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  posts_count: number;
  has_reels?: boolean; // Whether profile has any video posts
  has_any_active_story?: boolean; // Whether profile has any active stories (regardless of views)
  has_active_story?: boolean; // Whether profile has active stories not yet viewed by current user
  has_viewed_story?: boolean; // Whether current user has viewed this profile's stories
  created_at?: string;
  updated_at?: string;
}

/**
 * Post information for grid display
 */
export interface Post {
  id: number;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  media_count: number; // Total media items in carousel
}

/**
 * Simplified post for preview display (hover card)
 */
export interface PreviewPost {
  id: number;
  media_url: string | null;
  media_type: string | null;
}

/**
 * Follow relationship between two profiles
 */
export interface FollowRelationship {
  id: number;
  follower_profile_id: number;
  following_profile_id: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

/**
 * Follow status information for UI rendering
 */
export interface FollowStatus {
  isFollowing: boolean;      // Current user follows this profile
  isFollowedBy: boolean;      // This profile follows current user
  isPending: boolean;         // Follow request is pending (private accounts)
  isOwnProfile: boolean;      // This is the current user's profile
}

/**
 * Story highlight information
 */
export interface StoryHighlight {
  id: number;
  profile_id: number;
  name: string;
  cover_image_url: string;
  created_at: string;
  story_count: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Response from GET /api/profiles/[username]
 */
export interface GetProfileResponse {
  profile: Profile;
}

/**
 * Response from GET /api/profiles/[username]/preview
 */
export interface ProfilePreviewResponse {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  recent_posts: PreviewPost[];
}

/**
 * Response from GET /api/profiles/[username]/posts
 */
export interface GetPostsResponse {
  posts: Post[];
  hasMore: boolean;
  total?: number;
}

/**
 * Response from GET /api/profiles/[username]/follow-status
 */
export interface GetFollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isPending: boolean;
  isOwnProfile: boolean;
}

/**
 * Response from GET /api/profiles/[username]/can-view
 */
export interface CanViewResponse {
  canView: boolean;
  reason?: 'private' | 'blocked' | 'not_found';
}

/**
 * Request body for POST /api/profiles/actions/follow
 */
export interface FollowRequest {
  targetProfileId: number;
}

/**
 * Response from POST /api/profiles/actions/follow
 */
export interface FollowResponse {
  success: boolean;
  status: 'pending' | 'accepted';
  message: string;
}

/**
 * Request body for POST /api/profiles/actions/unfollow
 */
export interface UnfollowRequest {
  targetProfileId: number;
}

/**
 * Response from POST /api/profiles/actions/unfollow
 */
export interface UnfollowResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props for ProfileHeader component
 */
export interface ProfileHeaderProps {
  profile: Profile;
  followStatus: FollowStatus;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
  isLoading?: boolean;
  onProfileImageClick?: () => void;
  onStoryClick?: () => void;
  isUploadingImage?: boolean;
}

/**
 * Props for ProfileStats component
 */
export interface ProfileStatsProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  canViewContent?: boolean; // Can view private profile content
}

/**
 * Props for ProfileBio component
 */
export interface ProfileBioProps {
  fullName: string | null;
  bio: string | null;
  websiteUrl: string | null;
}

/**
 * Props for ProfileActions component
 */
export interface ProfileActionsProps {
  isOwnProfile: boolean;
  isFollowing: boolean;
  isPending: boolean;
  isPrivate: boolean;
  isFollowedBy: boolean;
  onFollow: () => Promise<void>;
  onUnfollow: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Props for ProfileTabs component
 */
export interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  postsCount: number;
  showTagged: boolean; // Show saved tab (only on own profile)
  hasReels?: boolean; // Show reels tab if profile has reels
  canViewTagged?: boolean; // Show tagged tab if can view (public or following)
}

/**
 * Profile tab options
 */
export type ProfileTab = 'posts' | 'reels' | 'saved' | 'tagged';

/**
 * Props for ProfileGrid component
 */
export interface ProfileGridProps {
  posts: Post[];
  isLoading: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  tab?: ProfileTab;
  isOwnProfile?: boolean;
  onCreatePost?: () => void;
  onPostClick?: (post: Post) => void;
}

/**
 * Props for ProfilePrivateLock component
 */
export interface ProfilePrivateLockProps {
  username: string;
  isPending: boolean;
}

/**
 * Props for StoriesHighlights component
 */
export interface StoriesHighlightsProps {
  highlights: StoryHighlight[];
  profileId: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Profile page state enum
 */
export enum ProfileState {
  OWN_PROFILE = 'own_profile',
  PUBLIC_FOLLOWING = 'public_following',
  PUBLIC_NOT_FOLLOWING = 'public_not_following',
  PRIVATE_FOLLOWING = 'private_following',
  PRIVATE_NOT_FOLLOWING = 'private_not_following',
  PRIVATE_PENDING = 'private_pending',
}

/**
 * Error types for profile pages
 */
export type ProfileError =
  | { type: 'not_found'; message: string }
  | { type: 'cannot_view'; reason: 'private' | 'blocked' }
  | { type: 'network_error'; message: string }
  | { type: 'server_error'; message: string };
