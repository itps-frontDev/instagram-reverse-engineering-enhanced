"use server";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import {
  toggleLikeInputSchema,
  type LikeToggleData,
  type LikesActionResult,
  type ToggleLikeInput,
} from "@/features/likes/schema";

function mapLikeError(status: number): string {
  if (status === 404) return "Content not found.";
  if (status === 400) return "Invalid like request.";
  return "Likes service temporarily unavailable.";
}

export async function toggleLikeAction(
  input: ToggleLikeInput
): Promise<LikesActionResult<LikeToggleData>> {
  const parsed = toggleLikeInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid like input." };
  }

  const { likeableType, likeableId } = parsed.data;

  let response: Response;
  try {
    response = await springFetch(`/api/priv/likes/${likeableType}/${likeableId}`, {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Likes service is unreachable." };
  }

  if (!response.ok) {
    return { success: false, error: mapLikeError(response.status) };
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: "Unexpected response from likes service." };
  }

  return {
    success: true,
    data: {
      liked: Boolean(payload?.liked),
      count: Number(payload?.count ?? 0),
    },
  };
}
