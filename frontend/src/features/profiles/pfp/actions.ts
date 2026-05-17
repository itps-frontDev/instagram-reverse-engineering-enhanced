"use server";

import { redirect } from "next/navigation";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import type { PfpActionResult, PfpUploadData, PfpDeleteData } from "@/features/profiles/pfp/schema";

function mapPfpError(status: number): string {
  if (status === 400) return "Invalid file. Check format (JPEG, PNG, GIF, WebP) and size (max 5 MB).";
  if (status === 401) return "Session expired, please log in again.";
  if (status === 404) return "No profile image to remove.";
  if (status === 413) return "File exceeds maximum allowed size.";
  return "Profile image service temporarily unavailable.";
}

export async function uploadPfpAction(
  formData: FormData
): Promise<PfpActionResult<PfpUploadData>> {
  let response: Response | null = null;
  try {
    response = await springFetch("/api/priv/profiles/me/image", {
      method: "PUT",
      body: formData,
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      response = null;
    } else {
      return { success: false, error: "Profile image service is unreachable." };
    }
  }

  if (response === null) {
    redirect("/login");
  }

  if (!response.ok) {
    return { success: false, error: mapPfpError(response.status) };
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
    response = await springFetch("/api/priv/profiles/me/image", {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      response = null;
    } else {
      return { success: false, error: "Profile image service is unreachable." };
    }
  }

  if (response === null) {
    redirect("/login");
  }

  if (!response.ok) {
    return { success: false, error: mapPfpError(response.status) };
  }

  return { success: true, data: { profileImageUrl: null } };
}
