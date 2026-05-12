import { z } from "zod";

export const notificationsActionResultSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.union([
    z.object({ success: z.literal(true), data: dataSchema }),
    z.object({ success: z.literal(false), error: z.string().min(1) }),
  ]);

export const notificationTypeSchema = z.enum([
  "like_post",
  "like_comment",
  "like_story",
  "comment",
  "comment_reply",
  "follow",
  "follow_request",
  "follow_accepted",
  "mention_post",
  "mention_comment",
  "mention_story",
  "tag",
  "message",
  "story_view",
]);

export const notificationReferenceTypeSchema = z
  .enum(["post", "comment", "story", "profile", "message"])
  .nullable();

export const notificationItemSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  sender_profile_id: z.number().int().positive().nullable(),
  sender_username: z.string().trim().nullable(),
  sender_full_name: z.string().trim().nullable(),
  sender_profile_image_url: z.string().trim().nullable(),
  sender_is_verified: z.boolean(),
  reference_type: notificationReferenceTypeSchema,
  reference_id: z.number().int().positive().nullable(),
  reference_post_id: z.number().int().positive().nullable(),
  reference_image_url: z.string().trim().nullable(),
  reference_media_type: z.string().trim().nullable(),
  is_read: z.boolean(),
  created_at: z.string().trim().min(1),
});

export const getNotificationsInputSchema = z.object({
  limit: z.number().int().positive().max(100).optional(),
  cursor: z.string().trim().min(1).optional(),
});

export const markNotificationReadInputSchema = z.object({
  notificationUuid: z.string().uuid(),
});

export const deleteNotificationInputSchema = z.object({
  notificationUuid: z.string().uuid(),
});

export const notificationListDataSchema = z.object({
  notifications: z.array(notificationItemSchema),
  nextCursor: z.string().nullable(),
  unreadCountSnapshot: z.number().int().nonnegative().nullable(),
});

export const unreadCountDataSchema = z.object({
  count: z.number().int().nonnegative(),
});

export const notificationMutationDataSchema = z.object({
  success: z.boolean(),
  updatedCount: z.number().int().nonnegative(),
  message: z.string().trim().min(1).optional(),
});

export type NotificationsActionResult<T> = { success: true; data: T } | { success: false; error: string };
export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationReferenceType = z.infer<typeof notificationReferenceTypeSchema>;
export type GetNotificationsInput = z.infer<typeof getNotificationsInputSchema>;
export type NotificationListData = z.infer<typeof notificationListDataSchema>;
export type UnreadCountData = z.infer<typeof unreadCountDataSchema>;
export type NotificationMutationData = z.infer<typeof notificationMutationDataSchema>;
export type MarkNotificationReadInput = z.infer<typeof markNotificationReadInputSchema>;
export type DeleteNotificationInput = z.infer<typeof deleteNotificationInputSchema>;
