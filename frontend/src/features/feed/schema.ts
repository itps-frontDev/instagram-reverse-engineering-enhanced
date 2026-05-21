import { z } from 'zod';

export const feedInputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const feedMediaSchema = z.object({
  id: z.number().int().nonnegative(),
  post_id: z.number().int().nonnegative(),
  media_url: z.string().min(1),
  media_type: z.enum(['image', 'video']),
  duration_seconds: z.number().int().nonnegative().nullable(),
  position: z.number().int().nonnegative(),
});

const feedPostSchema = z.object({
  id: z.number().int().nonnegative(),
  profile_id: z.number().int().nonnegative(),
  caption: z.string().nullable(),
  location: z.string().nullable(),
  is_comments_disabled: z.boolean(),
  is_likes_hidden: z.boolean(),
  likes_count: z.number().int().nonnegative(),
  comments_count: z.number().int().nonnegative(),
  created_at: z.string(),
  profile_username: z.string(),
  profile_full_name: z.string().nullable(),
  profile_image_url: z.string().nullable(),
  profile_is_verified: z.boolean(),
  profile_has_active_story: z.boolean(),
  profile_has_viewed_story: z.boolean(),
  profile_is_private: z.boolean(),
  media: z.array(feedMediaSchema),
  is_liked_by_current_user: z.boolean(),
  is_saved_by_current_user: z.boolean(),
  is_following_author: z.boolean(),
  has_tags: z.boolean(),
});

const feedDataSchema = z.object({
  posts: z.array(feedPostSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

const feedBackendSuccessSchema = z.object({
  success: z.literal(true),
  data: feedDataSchema,
  message: z.string().optional(),
});

const feedBackendErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().min(1),
  message: z.string().optional(),
});

export const feedBackendResponseSchema = z.union([
  feedBackendSuccessSchema,
  feedBackendErrorSchema,
]);

export const feedActionResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: feedDataSchema,
  }),
  z.object({
    success: z.literal(false),
    error: z.string().min(1),
  }),
]);

export type FeedInput = z.infer<typeof feedInputSchema>;
export type FeedActionResult = z.infer<typeof feedActionResultSchema>;
