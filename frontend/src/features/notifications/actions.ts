"use server";

import { revalidatePath } from "next/cache";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import {
  deleteNotificationInputSchema,
  getNotificationsInputSchema,
  markNotificationReadInputSchema,
  type DeleteNotificationInput,
  type GetNotificationsInput,
  type MarkNotificationReadInput,
  type NotificationListData,
  type NotificationMutationData,
  type NotificationReferenceType,
  type NotificationType,
  type NotificationsActionResult,
  type UnreadCountData,
} from "@/features/notifications/schema";

type BackendActionResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
};

type BackendNotificationItem = {
  id: string;
  type: NotificationType;
  senderProfileId: number | null;
  senderUsername: string | null;
  senderFullName: string | null;
  senderProfileImageUrl: string | null;
  senderIsVerified: boolean;
  referenceType: NotificationReferenceType;
  referenceId: number | null;
  referencePostId: number | null;
  referenceImageUrl: string | null;
  referenceMediaType: string | null;
  isRead: boolean;
  createdAt: string;
};

function mapBackendNotification(item: BackendNotificationItem) {
  return {
    id: item.id,
    type: item.type,
    sender_profile_id: item.senderProfileId,
    sender_username: item.senderUsername,
    sender_full_name: item.senderFullName,
    sender_profile_image_url: item.senderProfileImageUrl,
    sender_is_verified: Boolean(item.senderIsVerified),
    reference_type: item.referenceType,
    reference_id: item.referenceId,
    reference_post_id: item.referencePostId,
    reference_image_url: item.referenceImageUrl,
    reference_media_type: item.referenceMediaType,
    is_read: Boolean(item.isRead),
    created_at: item.createdAt,
  };
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapError(status: number): string {
  if (status === 401) return "Authentication required.";
  if (status === 403) return "You cannot access this notification.";
  if (status === 404) return "Notification not found.";
  if (status === 400) return "Invalid notification request.";
  return "Notifications service temporarily unavailable.";
}

async function callNotificationsApi<T>(input: {
  path: string;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}): Promise<NotificationsActionResult<T>> {
  let response: Response;
  try {
    response = await springFetch(input.path, {
      method: input.method ?? "GET",
      headers: { "Content-Type": "application/json" },
      body: input.body ? JSON.stringify(input.body) : undefined,
    });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: "Authentication required." };
    return { success: false, error: "Notifications backend is unreachable." };
  }

  const payload = (await parseJsonSafe(response)) as BackendActionResponse<T> | null;
  if (!response.ok) {
    return { success: false, error: payload?.message ?? mapError(response.status) };
  }

  if (!payload?.success) {
    return { success: false, error: payload?.message ?? "Notifications request failed." };
  }

  return { success: true, data: payload.data as T };
}

export async function getNotificationsAction(
  input: GetNotificationsInput = {}
): Promise<NotificationsActionResult<NotificationListData>> {
  const parsed = getNotificationsInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid notifications query input." };
  }

  const query = new URLSearchParams();
  if (parsed.data.limit) query.set("limit", String(parsed.data.limit));
  if (parsed.data.cursor) query.set("cursor", parsed.data.cursor);
  const path = query.size > 0 ? `/api/priv/notifications?${query.toString()}` : "/api/priv/notifications";

  const result = await callNotificationsApi<{
    items: BackendNotificationItem[];
    nextCursor: string | null;
    unreadCountSnapshot: number | null;
  }>({ path, method: "GET" });

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      notifications: (result.data.items ?? []).map(mapBackendNotification),
      nextCursor: result.data.nextCursor ?? null,
      unreadCountSnapshot: result.data.unreadCountSnapshot ?? null,
    },
  };
}

export async function getUnreadCountAction(): Promise<NotificationsActionResult<UnreadCountData>> {
  return await callNotificationsApi<UnreadCountData>({
    path: "/api/priv/notifications/unread-count",
    method: "GET",
  });
}

export async function markAllNotificationsReadAction(): Promise<NotificationsActionResult<NotificationMutationData>> {
  const result = await callNotificationsApi<NotificationMutationData>({
    path: "/api/priv/notifications/read-all",
    method: "PATCH",
  });

  if (result.success) {
    revalidatePath("/");
  }
  return result;
}

export async function markNotificationReadAction(
  input: MarkNotificationReadInput
): Promise<NotificationsActionResult<NotificationMutationData>> {
  const parsed = markNotificationReadInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid notification UUID." };
  }

  const result = await callNotificationsApi<NotificationMutationData>({
    path: `/api/priv/notifications/${parsed.data.notificationUuid}/read`,
    method: "PATCH",
  });

  if (result.success) {
    revalidatePath("/");
  }
  return result;
}

export async function deleteNotificationAction(
  input: DeleteNotificationInput
): Promise<NotificationsActionResult<NotificationMutationData>> {
  const parsed = deleteNotificationInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid notification UUID." };
  }

  const result = await callNotificationsApi<NotificationMutationData>({
    path: `/api/priv/notifications/${parsed.data.notificationUuid}`,
    method: "DELETE",
  });

  if (result.success) {
    revalidatePath("/");
  }
  return result;
}
