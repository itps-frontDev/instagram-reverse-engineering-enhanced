import { z } from 'zod';

export const createPostInputSchema = z.object({
  images: z.array(z.instanceof(File)).min(1, "Almeno un'immagine è richiesta").max(10, 'Massimo 10 immagini'),
  caption: z.string().max(2200).optional(),
  location: z.string().optional(),
  isCommentsDisabled: z.boolean().default(false),
  isLikesHidden: z.boolean().default(false),
});
export type CreatePostInput = z.infer<typeof createPostInputSchema>;

export const createPostResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), postId: z.number().int() }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type CreatePostResult = z.infer<typeof createPostResultSchema>;

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

export const deletePostInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
});

export const deletePostResultSchema = z.union([
  z.object({
    success: z.literal(true),
  }),
  z.object({
    success: z.literal(false),
    error: z.string().trim().min(1),
  }),
]);

export type DeletePostInput = z.infer<typeof deletePostInputSchema>;
export type DeletePostResult = z.infer<typeof deletePostResultSchema>;

export const updatePostCaptionInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
  caption: z.string().max(2200),
});

export const updatePostCaptionResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: z.object({
      caption: z.string(),
    }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string().trim().min(1),
  }),
]);

export type UpdatePostCaptionInput = z.infer<typeof updatePostCaptionInputSchema>;
export type UpdatePostCaptionResult = z.infer<typeof updatePostCaptionResultSchema>;


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

// ============================================================================
// Single Post Detail (GET /api/priv/posts/{postId})
// ============================================================================

export const PostDetailMediaSchema = z.object({
  // Spring può restituire path relativi (es. posts/123/img-0.jpg), non sempre URL assoluti.
  mediaUrl: z.string().trim().min(1),
  mediaType: z.enum(['image', 'video']),
  position: z.number().int().nonnegative(),
  // Per immagini il backend può valorizzare null.
  durationSeconds: z.number().nonnegative().nullable().optional(),
});

export const PostDetailSchema = z.object({
  id: z.number().int().positive(),
  profileId: z.number().int().positive(),
  caption: z.string().nullable(),
  likesCount: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  createdAt: z.string(), // ISO datetime
  profileUsername: z.string(),
  profileFullName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  profileIsVerified: z.boolean(),
  profileHasActiveStory: z.boolean(),
  profileHasViewedStory: z.boolean(),
  profileIsPrivate: z.boolean(),
  isLikedByCurrentUser: z.boolean(),
  isSavedByCurrentUser: z.boolean(),
  isFollowingAuthor: z.boolean(),
  hasTags: z.boolean(),
  media: z.array(PostDetailMediaSchema),
});

export const getPostDetailInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
});

export const getPostDetailResultSchema = z.union([
  z.object({
    success: z.literal(true),
    data: PostDetailSchema,
    message: z.string().trim().optional(),
    error: z.null().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string().trim().min(1),
    message: z.string().trim().optional(),
    data: z.null().optional(),
  }),
]);

export type PostDetailMediaDTO = z.infer<typeof PostDetailMediaSchema>;
export type PostDetailDTO = z.infer<typeof PostDetailSchema>;
export type GetPostDetailInput = z.infer<typeof getPostDetailInputSchema>;
export type GetPostDetailResult = z.infer<typeof getPostDetailResultSchema>;
