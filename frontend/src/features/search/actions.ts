"use server";

import { springFetch } from "@/lib/spring-client";
import { SpringAuthError } from "@/lib/spring-error";
import {
  searchBackendResponseSchema,
  searchInputSchema,
  type SearchActionResult,
  type SearchData,
  type SearchInput,
} from "@/features/search/schema";

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function searchProfilesAction(input: SearchInput): Promise<SearchActionResult<SearchData>> {
  const parsed = searchInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid search input." };
  }

  const params = new URLSearchParams({
    q: parsed.data.q,
    type: parsed.data.type,
    limit: String(parsed.data.limit),
  });

  let response: Response;
  try {
    response = await springFetch(`/api/priv/search?${params.toString()}`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: "Authentication required." };
    return { success: false, error: "Search service unavailable." };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = searchBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: "Invalid search response payload." };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message };
  }

  return { success: true, data: parsedPayload.data.data };
}
