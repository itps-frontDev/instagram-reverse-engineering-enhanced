'use server';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import {
  followStatusResponseSchema,
  getFollowStatusInputSchema,
  getFollowStatusResultSchema,
  type GetFollowStatusInput,
  type GetFollowStatusResult,
} from '@/features/profile/schema';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';

const GET_FOLLOW_STATUS_TIMEOUT_MS = 5_000;

export async function getFollowStatusAction(input: GetFollowStatusInput): Promise<GetFollowStatusResult> {
  const parsed = getFollowStatusInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const { username } = parsed.data;
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}/follow-status`)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(GET_FOLLOW_STATUS_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followStatusResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getFollowStatusResultSchema.parse({
    success: true,
    data: parsedPayload.data.data,
  });
}
