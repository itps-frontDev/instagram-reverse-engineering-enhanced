'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  getFollowStatusInputSchema,
  getFollowStatusResultSchema,
  followStatusResponseSchema,
  getFollowersInputSchema,
  getFollowersResultSchema,
  followersResponseSchema,
  getFollowingInputSchema,
  getFollowingResultSchema,
  followingResponseSchema,
  toggleFollowInputSchema,
  toggleFollowResultSchema,
  toggleFollowResponseSchema,
  followMutationInputSchema,
  followMutationResponseSchema,
  suggestionsResponseSchema,
  getSuggestionsResultSchema,
  type GetFollowStatusInput,
  type GetFollowStatusResult,
  type GetFollowersInput,
  type GetFollowersResult,
  type GetFollowingInput,
  type GetFollowingResult,
  type ToggleFollowInput,
  type ToggleFollowResult,
  type FollowMutationInput,
  type FollowMutationResult,
  type GetSuggestionsResult,
} from './schema';


async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// ─── Read actions ─────────────────────────────────────────────────────────────

export async function getFollowStatusAction(input: GetFollowStatusInput): Promise<GetFollowStatusResult> {
  const parsed = getFollowStatusInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  const { username } = parsed.data;
  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/${encodeURIComponent(username)}/status`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followStatusResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getFollowStatusResultSchema.parse({ success: true, data: parsedPayload.data.data });
}

export async function getFollowersAction(input: GetFollowersInput): Promise<GetFollowersResult> {
  const parsed = getFollowersInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  const { username } = parsed.data;
  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/${encodeURIComponent(username)}/followers`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followersResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getFollowersResultSchema.parse({
    success: true,
    data: {
      followers: parsedPayload.data.data.map((f) => ({
        id: f.id,
        username: f.username,
        full_name: f.fullName ?? null,
        profile_image_url: f.profileImageUrl ?? null,
        follow_status: f.followStatus,
        is_following: f.followStatus === 'accepted',
        isPending: f.followStatus === 'pending',
        is_verified: false,
        follows_you: false,
      })),
    },
  });
}

export async function getFollowingAction(input: GetFollowingInput): Promise<GetFollowingResult> {
  const parsed = getFollowingInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  const { username } = parsed.data;
  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/${encodeURIComponent(username)}/following`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followingResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getFollowingResultSchema.parse({
    success: true,
    data: parsedPayload.data.data.map((p) => ({
      id: p.id,
      username: p.username,
      fullName: p.fullName ?? null,
      profileImageUrl: p.profileImageUrl ?? null,
      followStatus: p.followStatus,
    })),
  });
}

// ─── Mutation actions ─────────────────────────────────────────────────────────

export async function toggleFollowAction(input: ToggleFollowInput): Promise<ToggleFollowResult> {
  const parsed = toggleFollowInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/${parsed.data.targetProfileId}`, { method: 'POST' });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = toggleFollowResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return toggleFollowResultSchema.parse({ success: true, data: parsedPayload.data.data });
}

export async function acceptFollowRequestAction(input: FollowMutationInput): Promise<FollowMutationResult> {
  const parsed = followMutationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/requests/${parsed.data.profileId}/accept`, { method: 'POST' });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followMutationResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return { success: true };
}

export async function rejectFollowRequestAction(input: FollowMutationInput): Promise<FollowMutationResult> {
  const parsed = followMutationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/requests/${parsed.data.profileId}/reject`, { method: 'POST' });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followMutationResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return { success: true };
}

export async function getSuggestionsAction(): Promise<GetSuggestionsResult> {
  let response: Response;
  try {
    response = await springFetch('/api/priv/follows/suggestions');
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = suggestionsResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return getSuggestionsResultSchema.parse({ success: true, data: parsedPayload.data.data });
}

export async function removeFollowerAction(input: FollowMutationInput): Promise<FollowMutationResult> {
  const parsed = followMutationInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Invalid input.' };

  let response: Response;
  try {
    response = await springFetch(`/api/priv/follows/followers/${parsed.data.profileId}`, { method: 'DELETE' });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = followMutationResponseSchema.safeParse(payload);
  if (!parsedPayload.success) return { success: false, error: 'Invalid response payload.' };
  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  return { success: true };
}
