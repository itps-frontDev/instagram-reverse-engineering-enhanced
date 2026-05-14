import { z } from 'zod';

// Input schema for can-view action
export const canViewProfileInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Response data schema when success is true
export const profileVisibilityDataSchema = z.object({
  canView: z.boolean(),
});

// Uniform API response schema - success case
export const profileVisibilitySuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profileVisibilityDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

// Uniform API response schema - error case
export const profileVisibilityErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// Union of success and error responses
export const profileVisibilityResponseSchema = z.union([
  profileVisibilitySuccessResponseSchema,
  profileVisibilityErrorResponseSchema,
]);

// Normalized action result for UI consumption
export const canViewProfileResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      canView: z.boolean(),
    })
    .optional(),
  error: z.string().optional(),
});

// Input schema for follow-status action
export const getFollowStatusInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Response data schema when success is true
export const followStatusDataSchema = z.object({
  status: z.enum(['self', 'none', 'pending', 'accepted']),
});

// Uniform API response schema - success case
export const followStatusSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: followStatusDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

// Uniform API response schema - error case
export const followStatusErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

// Union of success and error responses
export const followStatusResponseSchema = z.union([
  followStatusSuccessResponseSchema,
  followStatusErrorResponseSchema,
]);

// Normalized action result for UI consumption
export const getFollowStatusResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      status: z.enum(['self', 'none', 'pending', 'accepted']),
    })
    .optional(),
  error: z.string().optional(),
});

// Input schema for profile-by-username action
export const getProfileByUsernameInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

export const getProfilePreviewInputSchema = z.object({
  username: z.string().min(1, 'Username is required'),
});

// Response data schema when success is true
export const profileByUsernameDataSchema = z.object({
  id: z.number().int().positive(),
  userId: z.string().uuid(),
  username: z.string().min(1),
  fullName: z.string().nullable().optional(),
  profileImageUrl: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  isPrivate: z.boolean(),
  isVerified: z.boolean().optional(),
  followersCount: z.number().int(),
  followingCount: z.number().int(),
  postsCount: z.number().int(),
  hasReels: z.boolean().nullable().optional(),
  hasAnyActiveStory: z.boolean().nullable().optional(),
  hasActiveStory: z.boolean().nullable().optional(),
  hasViewedStory: z.boolean().nullable().optional(),
  isOwner: z.boolean(),
  canView: z.boolean(),
  followStatus: z.enum(['self', 'none', 'pending', 'accepted']),
});

export const profileByUsernameSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profileByUsernameDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

export const profileByUsernameErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const profileByUsernameResponseSchema = z.union([
  profileByUsernameSuccessResponseSchema,
  profileByUsernameErrorResponseSchema,
]);

// Normalized action result for UI consumption (compatibile con il legacy type Profile)
export const getProfileByUsernameResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      profile: z.object({
        id: z.number().int().positive(),
        user_id: z.string(),
        username: z.string(),
        full_name: z.string().nullable(),
        profile_image_url: z.string().nullable(),
        bio: z.string().nullable(),
        website_url: z.string().nullable(),
        is_private: z.boolean(),
        is_verified: z.boolean(),
        followers_count: z.number().int(),
        following_count: z.number().int(),
        posts_count: z.number().int(),
        has_reels: z.boolean().optional(),
        has_any_active_story: z.boolean().optional(),
        has_active_story: z.boolean().optional(),
        has_viewed_story: z.boolean().optional(),
      }),
      context: z.object({
        isOwner: z.boolean(),
        canView: z.boolean(),
        followStatus: z.enum(['self', 'none', 'pending', 'accepted']),
        isPrivate: z.boolean(),
      }),
    })
    .optional(),
  error: z.string().optional(),
});

export const recentPostPreviewSchema = z.object({
  id: z.number().int().positive(),
  mediaUrl: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
});

export const profilePreviewDataSchema = z.object({
  username: z.string().min(1),
  fullName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  followersCount: z.number().int(),
  followingCount: z.number().int(),
  postsCount: z.number().int(),
  followStatus: z.enum(['self', 'none', 'pending', 'accepted']),
  isOwner: z.boolean(),
  canView: z.boolean(),
  recentPosts: z.array(recentPostPreviewSchema),
});

export const profilePreviewSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: profilePreviewDataSchema,
  message: z.string().optional(),
  error: z.null().optional(),
});

export const profilePreviewErrorResponseSchema = z.object({
  success: z.literal(false),
  data: z.never().optional(),
  message: z.string().optional(),
  error: z.string(),
});

export const profilePreviewResponseSchema = z.union([
  profilePreviewSuccessResponseSchema,
  profilePreviewErrorResponseSchema,
]);

export const getProfilePreviewResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      username: z.string(),
      full_name: z.string().nullable(),
      profile_image_url: z.string().nullable(),
      posts_count: z.number().int(),
      followers_count: z.number().int(),
      following_count: z.number().int(),
      follow_status: z.enum(['self', 'none', 'pending', 'accepted']),
      is_owner: z.boolean(),
      can_view: z.boolean(),
      recent_posts: z.array(
        z.object({
          id: z.number().int().positive(),
          media_url: z.string().nullable(),
          type: z.string().nullable(),
        })
      ),
    })
    .optional(),
  error: z.string().optional(),
});

export type CanViewProfileInput = z.infer<typeof canViewProfileInputSchema>;
export type ProfileVisibilityData = z.infer<typeof profileVisibilityDataSchema>;
export type ProfileVisibilityResponse = z.infer<typeof profileVisibilityResponseSchema>;
export type CanViewProfileResult = z.infer<typeof canViewProfileResultSchema>;

export type GetFollowStatusInput = z.infer<typeof getFollowStatusInputSchema>;
export type FollowStatusData = z.infer<typeof followStatusDataSchema>;
export type FollowStatusResponse = z.infer<typeof followStatusResponseSchema>;
export type GetFollowStatusResult = z.infer<typeof getFollowStatusResultSchema>;

export type GetProfileByUsernameInput = z.infer<typeof getProfileByUsernameInputSchema>;
export type ProfileByUsernameData = z.infer<typeof profileByUsernameDataSchema>;
export type ProfileByUsernameResponse = z.infer<typeof profileByUsernameResponseSchema>;
export type GetProfileByUsernameResult = z.infer<typeof getProfileByUsernameResultSchema>;
export type GetProfilePreviewInput = z.infer<typeof getProfilePreviewInputSchema>;
export type ProfilePreviewData = z.infer<typeof profilePreviewDataSchema>;
export type ProfilePreviewResponse = z.infer<typeof profilePreviewResponseSchema>;
export type GetProfilePreviewResult = z.infer<typeof getProfilePreviewResultSchema>;
