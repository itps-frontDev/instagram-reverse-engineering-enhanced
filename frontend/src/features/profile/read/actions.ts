'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  getProfileByUsernameInputSchema,
  getProfileByUsernameResultSchema,
  getProfilePreviewInputSchema,
  getProfilePreviewResultSchema,
  meProfileSchema,
  meProfileSpringSuccessSchema,
  profileByUsernameResponseSchema,
  profilePreviewResponseSchema,
  type GetProfileByUsernameInput,
  type GetProfileByUsernameResult,
  type GetProfilePreviewInput,
  type GetProfilePreviewResult,
  type MeProfile,
} from './schema';
import { parseJsonSafe } from '@/features/profile/shared';


type GetMeProfileResult =
  | { success: true; data: MeProfile }
  | { success: false; error: string };

export async function getMeProfileAction(): Promise<GetMeProfileResult> {
  let response: Response;
  try {
    response = await springFetch('/api/priv/profiles/me', { method: 'GET' });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsed = meProfileSpringSuccessSchema.safeParse(payload);
  if (!parsed.success) return { success: false, error: 'Invalid response payload.' };

  const d = parsed.data.data;
  const profile = meProfileSchema.parse({
    id: d.id,
    user_id: d.userId,
    username: d.username,
    full_name: d.fullName ?? null,
    profile_image_url: d.profileImageUrl ?? null,
    bio: d.bio ?? null,
    website_url: d.websiteUrl ?? null,
    gender: d.gender ?? null,
    custom_gender: d.custom_gender ?? null,
    is_private: d.isPrivate,
    is_verified: d.isVerified,
    followers_count: d.followersCount,
    following_count: d.followingCount,
    posts_count: d.postsCount,
  });

  return { success: true, data: profile };
}

export async function getProfileByUsernameAction(input: GetProfileByUsernameInput): Promise<GetProfileByUsernameResult> {
  const parsed = getProfileByUsernameInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { username } = parsed.data;
  let response: Response;
  try {
    response = await springFetch(`/api/priv/profiles/${encodeURIComponent(username)}`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
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

export async function getProfilePreviewAction(input: GetProfilePreviewInput): Promise<GetProfilePreviewResult> {
  const parsed = getProfilePreviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const { username } = parsed.data;
  let response: Response;
  try {
    response = await springFetch(`/api/priv/profiles/${encodeURIComponent(username)}/preview`);
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = profilePreviewResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!parsedPayload.data.success) {
    return { success: false, error: parsedPayload.data.message || parsedPayload.data.error };
  }

  const preview = parsedPayload.data.data;
  return getProfilePreviewResultSchema.parse({
    success: true,
    data: {
      username: preview.username,
      full_name: preview.fullName ?? null,
      profile_image_url: preview.profileImageUrl ?? null,
      posts_count: preview.postsCount,
      followers_count: preview.followersCount,
      following_count: preview.followingCount,
      follow_status: preview.followStatus,
      is_owner: preview.isOwner,
      can_view: preview.canView,
      recent_posts: preview.recentPosts.map((post) => ({
        id: post.id,
        media_url: post.mediaUrl ?? null,
        type: post.type ?? null,
      })),
    },
  });
}
