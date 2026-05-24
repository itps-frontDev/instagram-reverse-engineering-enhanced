import { z } from 'zod';

export const reelMediaItemSchema = z.object({
  id: z.number().int(),
  mediaUrl: z.string(),
  mediaType: z.enum(['image', 'video']),
  durationSeconds: z.number().nullable(),
  position: z.number().int(),
});
export type ReelMediaItem = z.infer<typeof reelMediaItemSchema>;

export const reelItemSchema = z.object({
  id: z.number().int(),
  profileId: z.number().int(),
  caption: z.string().nullable(),
  location: z.string().nullable(),
  isCommentsDisabled: z.boolean(),
  isLikesHidden: z.boolean(),
  likesCount: z.number().int(),
  commentsCount: z.number().int(),
  createdAt: z.string(),
  profileUsername: z.string(),
  profileFullName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  profileIsVerified: z.boolean(),
  isLikedByCurrentUser: z.boolean(),
  isSavedByCurrentUser: z.boolean(),
  media: z.array(reelMediaItemSchema),
});
export type ReelItem = z.infer<typeof reelItemSchema>;

export const getReelsInputSchema = z.object({
  limit: z.number().int().min(1).max(50).default(10),
  excludeIds: z.array(z.number().int()).default([]),
});
export type GetReelsInput = z.infer<typeof getReelsInputSchema>;

export const getReelsFeedResponseSchema = z.object({
  reels: z.array(reelItemSchema),
  hasMore: z.boolean(),
});

export const getReelsResultSchema = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), data: getReelsFeedResponseSchema }),
  z.object({ success: z.literal(false), error: z.string() }),
]);
export type GetReelsResult = z.infer<typeof getReelsResultSchema>;
