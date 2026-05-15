'use server';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import {
  followStatusResponseSchema,
  getProfileFollowersInputSchema,
  getProfileFollowersResultSchema,
  getFollowStatusInputSchema,
  getFollowStatusResultSchema,
  profileFollowersResponseSchema,
  getProfileFollowingInputSchema,
  getProfileFollowingResultSchema,
  profileFollowingResponseSchema,
  type GetProfileFollowersInput,
  type GetProfileFollowersResult,
  type GetFollowStatusInput,
  type GetFollowStatusResult,
  type GetProfileFollowingInput,
  type GetProfileFollowingResult,
} from '@/features/profile/schema';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';

const GET_FOLLOW_STATUS_TIMEOUT_MS = 5_000;
const GET_PROFILE_FOLLOWERS_TIMEOUT_MS = 5_000;
const GET_PROFILE_FOLLOWING_TIMEOUT_MS = 5_000;

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

export async function getProfileFollowersAction(input: GetProfileFollowersInput): Promise<GetProfileFollowersResult> {
  const parsed = getProfileFollowersInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const { username } = parsed.data;
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}/followers`)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(GET_PROFILE_FOLLOWERS_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = profileFollowersResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getProfileFollowersResultSchema.parse({
    success: true,
    data: {
      followers: parsedPayload.data.data.map((follower) => ({
        id: follower.id,
        username: follower.username,
        full_name: follower.fullName ?? null,
        profile_image_url: follower.profileImageUrl ?? null,
        follow_status: follower.followStatus,
        is_following: follower.followStatus === 'accepted',
        isPending: follower.followStatus === 'pending',
        is_verified: false,
        follows_you: false,
      })),
    },
  });
}

export async function getProfileFollowingAction(
  input: GetProfileFollowingInput
): Promise<GetProfileFollowingResult> {
  const parsed = getProfileFollowingInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const { username } = parsed.data;
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}/following`)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(GET_PROFILE_FOLLOWING_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = profileFollowingResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  const following = parsedPayload.data.data;
  return getProfileFollowingResultSchema.parse({
    success: true,
    data: following.map((profile) => ({
      id: profile.id,
      username: profile.username,
      fullName: profile.fullName ?? null,
      profileImageUrl: profile.profileImageUrl ?? null,
      followStatus: profile.followStatus,
    })),
  });
}
