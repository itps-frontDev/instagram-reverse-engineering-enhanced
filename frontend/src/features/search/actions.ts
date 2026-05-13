"use server";

import { cookies } from "next/headers";

import { buildSpringAuthUrl, getAccessTokenCookieName } from "@/lib/auth/backend";
import {
  searchBackendResponseSchema,
  searchInputSchema,
  type SearchActionResult,
  type SearchData,
  type SearchInput,
} from "@/features/search/schema";

const SEARCH_TIMEOUT_MS = 10_000;

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

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;
  if (!accessToken) {
    return { success: false, error: "Authentication required." };
  }

  const params = new URLSearchParams({
    q: parsed.data.q,
    type: parsed.data.type,
    limit: String(parsed.data.limit),
  });
  const url = `${buildSpringAuthUrl("/api/priv/search")}?${params.toString()}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
    });
  } catch {
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
