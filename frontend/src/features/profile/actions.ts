'use server';

import { cookies } from 'next/headers';

import { buildSpringAuthUrl, getAccessTokenCookieName } from '@/lib/auth/backend';
import {
  canViewProfileInputSchema,
  canViewProfileResultSchema,
  profileVisibilityResponseSchema,
  getProfileByUsernameInputSchema,
  getProfileByUsernameResultSchema,
  profileByUsernameResponseSchema,
  getFollowStatusInputSchema,
  getFollowStatusResultSchema,
  followStatusResponseSchema,
  type CanViewProfileInput,
  type CanViewProfileResult,
  type GetProfileByUsernameInput,
  type GetProfileByUsernameResult,
  type GetFollowStatusInput,
  type GetFollowStatusResult,
} from '@/features/profile/schema';

const CAN_VIEW_PROFILE_TIMEOUT_MS = 5_000;
const GET_FOLLOW_STATUS_TIMEOUT_MS = 5_000;
const GET_PROFILE_BY_USERNAME_TIMEOUT_MS = 5_000;

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

/**
 * Server Action: Determine the follow status between the authenticated user and target profile.
 *
 * Status meanings:
 * - "self": the current user is the profile owner
 * - "none": no follow relationship exists
 * - "pending": follow request sent but not accepted
 * - "accepted": follow request accepted (follower can see private content)
 *
 * Timeout: 5 seconds (GET_FOLLOW_STATUS_TIMEOUT_MS = 5_000)
 * If the Spring endpoint takes longer than 5 seconds to respond, the fetch is aborted
 * and returns a network error. This prevents hanging requests on slow networks.
 *
 * @param input - GetFollowStatusInput with target username
 * @returns GetFollowStatusResult with status on success
 */
export async function getFollowStatusAction(input: GetFollowStatusInput): Promise<GetFollowStatusResult> {
  // Validate input
  const parsed = getFollowStatusInputSchema.safeParse(input);
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
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}/follow-status`)}`;

  let response: Response;
  try {
    // AbortSignal.timeout(5_000) = 5 second timeout
    // If fetch doesn't complete within 5000ms, the request is aborted
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

  // Parse and validate response
  const payload = await parseJsonSafe(response);
  const parsedPayload = followStatusResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  // Handle error response from backend
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  // Return normalized success result
  return getFollowStatusResultSchema.parse({
    success: true,
    data: parsedPayload.data.data,
  });
}

/**
 * Server Action: Read profile by username with contextual flags from Spring.
 *
 * Restituisce una struttura normalizzata compatibile con i tipi legacy frontend.
 *
 * @param input - GetProfileByUsernameInput with target username
 * @returns GetProfileByUsernameResult with profile and context on success
 */
export async function getProfileByUsernameAction(input: GetProfileByUsernameInput): Promise<GetProfileByUsernameResult> {
  const parsed = getProfileByUsernameInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(getAccessTokenCookieName())?.value;
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const { username } = parsed.data;
  const url = `${buildSpringAuthUrl(`/api/priv/profiles/${encodeURIComponent(username)}`)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(GET_PROFILE_BY_USERNAME_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = profileByUsernameResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  const springProfile = parsedPayload.data.data;

  // TODO(Strangler Story/Post): questi flag dipendono ancora dalla migrazione completa dei moduli stories/posts.
  return getProfileByUsernameResultSchema.parse({
    success: true,
    data: {
      profile: {
        id: springProfile.id,
        user_id: springProfile.userId,
        username: springProfile.username,
        full_name: springProfile.fullName ?? null,
        profile_image_url: springProfile.profileImageUrl ?? null,
        bio: springProfile.bio ?? null,
        website_url: springProfile.websiteUrl ?? null,
        is_private: springProfile.isPrivate,
        is_verified: springProfile.isVerified ?? false,
        followers_count: springProfile.followersCount,
        following_count: springProfile.followingCount,
        posts_count: springProfile.postsCount,
        has_reels: springProfile.hasReels ?? false,
        has_any_active_story: springProfile.hasAnyActiveStory ?? false,
        has_active_story: springProfile.hasActiveStory ?? false,
        has_viewed_story: springProfile.hasViewedStory ?? false,
      },
      context: {
        isOwner: springProfile.isOwner,
        canView: springProfile.canView,
        followStatus: springProfile.followStatus,
        isPrivate: springProfile.isPrivate,
      },
    },
  });
}
