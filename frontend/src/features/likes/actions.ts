"use server";

import { redirect } from "next/navigation";

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
  if (status === 401) return "Session expired, please log in again.";
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

  let response: Response | null = null;
  try {
    response = await springFetch(`/api/priv/likes/${likeableType}/${likeableId}`, {
      method: "POST",
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      response = null;
    } else {
      return { success: false, error: "Likes service is unreachable." };
    }
  }

  if (response === null) {
    redirect("/login");
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
