'use server';

import { cookies } from 'next/headers';

import { buildSpringAuthUrl, getAccessTokenCookieName } from '@/lib/auth/backend';
import {
  canViewProfileInputSchema,
  canViewProfileResultSchema,
  profileVisibilityResponseSchema,
  type CanViewProfileInput,
  type CanViewProfileResult,
} from '@/features/profile/schema';

const CAN_VIEW_PROFILE_TIMEOUT_MS = 5_000;

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Server Action: Determine if the authenticated user can view a target profile's contents.
 *
 * @param input - CanViewProfileInput with target username
 * @returns CanViewProfileResult with canView flag on success
 */
export async function canViewProfileAction(input: CanViewProfileInput): Promise<CanViewProfileResult> {
  // Validate input
  const parsed = canViewProfileInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  // Get authentication token
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const { username } = parsed.data;
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}/can-view`)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(CAN_VIEW_PROFILE_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  // Parse and validate response
  const payload = await parseJsonSafe(response);
  const parsedPayload = profileVisibilityResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  // Handle error response from backend
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  // Return normalized success result
  return canViewProfileResultSchema.parse({
    success: true,
    data: parsedPayload.data.data,
  });
}
