import { z } from 'zod';

export const listCommentsInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const createCommentInputSchema = z.object({
  postId: z.coerce.number().int().positive(),
  text: z.string().trim().min(1).max(2200),
  parentId: z.coerce.number().int().positive().optional(),
});

export const deleteCommentInputSchema = z.object({
  commentId: z.coerce.number().int().positive(),
});

export const commentBackendSchema = z.object({
  id: z.number().int().positive(),
  postId: z.number().int().positive(),
  profileId: z.number().int().positive(),
  parentId: z.number().int().positive().nullable(),
  text: z.string(),
  likesCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  profileUsername: z.string(),
  profileFullName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  profileIsVerified: z.boolean(),
  profileHasActiveStory: z.boolean(),
  profileHasViewedStory: z.boolean(),
  profileIsPrivate: z.boolean(),
  isLikedByCurrentUser: z.boolean(),
});

export type CommentBackend = z.infer<typeof commentBackendSchema>;

export const commentListBackendDataSchema = z.object({
  comments: z.array(commentBackendSchema),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

const commentBackendSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  data: z.unknown().nullable(),
  error: z.string().trim().nullable().optional(),
  message: z.string().trim().nullable().optional(),
});

const commentBackendErrorEnvelopeSchema = z.object({
  success: z.literal(false),
  data: z.unknown().nullable().optional(),
  error: z.string().trim().min(1),
  message: z.string().trim().nullable().optional(),
});

export const commentBackendResponseSchema = z.union([
  commentBackendSuccessEnvelopeSchema,
  commentBackendErrorEnvelopeSchema,
]);

export type ListCommentsInput = z.infer<typeof listCommentsInputSchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type DeleteCommentInput = z.infer<typeof deleteCommentInputSchema>;
