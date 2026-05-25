import { z } from 'zod';

export const storyItemSchema = z.object({
  id: z.number().int().positive(),
  profile_id: z.number().int().positive(),
  username: z.string(),
  profile_image_url: z.string().nullable(),
  is_verified: z.boolean().default(false),
  media_url: z.string(),
  media_type: z.enum(['image', 'video']),
  duration_seconds: z.number().nullable(),
  views_count: z.number().int().nonnegative(),
  created_at: z.string(),
  expires_at: z.string(),
  is_liked_by_me: z.boolean().default(false),
  is_viewed: z.boolean().default(false),
});

export const fetchActiveStoriesInputSchema = z.object({});

export const fetchProfileStoriesInputSchema = z.object({
  profileId: z.coerce.number().int().positive(),
});

export const storyCollectionBackendSuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    stories: z.array(storyItemSchema),
  }),
  message: z.string().optional(),
});

export const storyCollectionBackendErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const storyCollectionBackendResponseSchema = z.union([
  storyCollectionBackendSuccessSchema,
  storyCollectionBackendErrorSchema,
]);

export const storyCollectionResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      stories: z.array(storyItemSchema),
    })
    .optional(),
  error: z.string().optional(),
});

export const registerStoryViewInputSchema = z.object({
  storyId: z.coerce.number().int().positive(),
});

export const storyViewSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

export const storyViewErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  message: z.string().optional(),
});

export const storyViewResponseSchema = z.union([
  storyViewSuccessResponseSchema,
  storyViewErrorResponseSchema,
]);

export const registerStoryViewResultSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      message: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export type StoryItem = z.infer<typeof storyItemSchema>;
export type FetchActiveStoriesInput = z.infer<typeof fetchActiveStoriesInputSchema>;
export type FetchProfileStoriesInput = z.infer<typeof fetchProfileStoriesInputSchema>;
export type StoryCollectionBackendResponse = z.infer<typeof storyCollectionBackendResponseSchema>;
export type StoryCollectionResult = z.infer<typeof storyCollectionResultSchema>;
export type RegisterStoryViewInput = z.infer<typeof registerStoryViewInputSchema>;
export type StoryViewResponse = z.infer<typeof storyViewResponseSchema>;
export type RegisterStoryViewResult = z.infer<typeof registerStoryViewResultSchema>;
