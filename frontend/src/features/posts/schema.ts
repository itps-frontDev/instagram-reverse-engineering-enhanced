import { z } from 'zod';

export const togglePostSaveInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
});

const postSaveDataSchema = z.object({
  saved: z.boolean(),
});

const postSaveBackendSuccessSchema = z.object({
  success: z.literal(true),
  data: postSaveDataSchema,
  message: z.string().trim().optional(),
});

const postSaveBackendErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().trim().min(1),
  message: z.string().trim().optional(),
});

export const postSaveBackendResponseSchema = z.union([
  postSaveBackendSuccessSchema,
  postSaveBackendErrorSchema,
]);

export const togglePostSaveResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: postSaveDataSchema,
  }),
  z.object({
    success: z.literal(false),
    error: z.string().trim().min(1),
  }),
]);

export type TogglePostSaveInput = z.infer<typeof togglePostSaveInputSchema>;
export type TogglePostSaveResult = z.infer<typeof togglePostSaveResultSchema>;


// Profilo Posts Tab (GET /api/priv/profiles/{username}/posts)

export const ProfilePostItemSchema = z.object({
  id: z.number().int().positive(),
  caption: z.string().nullable(),
  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  createdAt: z.string(), // ISO datetime
  mediaUrl: z.string().nullable(),
  mediaType: z.enum(['image', 'video']).nullable(),
  mediaCount: z.number().int().positive(),
});

export const ProfilePostsResponseSchema = z.object({
  posts: z.array(ProfilePostItemSchema),
  hasMore: z.boolean(),
  total: z.number().int().nonnegative(),
});

export type ProfilePostItem = z.infer<typeof ProfilePostItemSchema>;
export type ProfilePostsResponse = z.infer<typeof ProfilePostsResponseSchema>;

export const GetProfilePostsInputSchema = z.object({
  username: z.string().min(1),
  tab: z.enum(['posts', 'reels', 'saved', 'tagged']).default('posts'),
  page: z.number().int().nonnegative().default(0),
});

export type GetProfilePostsInput = z.infer<typeof GetProfilePostsInputSchema>;
