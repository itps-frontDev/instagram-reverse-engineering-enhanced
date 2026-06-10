"use server";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import type { PfpActionResult, PfpUploadData, PfpDeleteData } from "@/features/profile/picture/schema";

function fallbackPfpError(status: number): string {
  if (status === 401) return "Session expired, please log in again.";
  if (status === 404) return "No profile image to remove.";
  if (status === 413) return "File exceeds maximum allowed size.";
  if (status >= 500) return "Profile image service temporarily unavailable.";
  return "Invalid file. Check format (JPEG, PNG, GIF, WebP) and size (max 10 MB).";
}

async function extractPfpError(response: Response): Promise<string> {
  try {
    const body = await response.json() as { message?: unknown };
    if (typeof body.message === "string" && body.message.trim()) {
      return body.message;
    }
  } catch {
    // fall through to status-based fallback
  }
  return fallbackPfpError(response.status);
}

export async function uploadPfpAction(
  formData: FormData
): Promise<PfpActionResult<PfpUploadData>> {
  let response: Response | null = null;
  try {
    response = await springFetch("/api/priv/profiles/me/picture", {
      method: "PUT",
      body: formData,
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, requiresLogin: true };
    }
    return { success: false, error: "Profile image service is unreachable." };
  }

  if (!response.ok) {
    return { success: false, error: await extractPfpError(response) };
  }

  let payload: Record<string, unknown> | null = null;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: "Unexpected response from profile image service." };
  }

  return {
    success: true,
    data: { profileImageUrl: String(payload?.profileImageUrl ?? "") },
  };
}

export async function deletePfpAction(): Promise<PfpActionResult<PfpDeleteData>> {
  let response: Response | null = null;
  try {
    response = await springFetch("/api/priv/profiles/me/picture", {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, requiresLogin: true };
    }
    return { success: false, error: "Profile image service is unreachable." };
  }

  if (!response.ok) {
    return { success: false, error: await extractPfpError(response) };
  }

  return { success: true, data: { profileImageUrl: null } };
}
