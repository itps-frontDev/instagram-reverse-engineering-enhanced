'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  fetchActiveStoriesInputSchema,
  fetchProfileStoriesInputSchema,
  storyCollectionBackendResponseSchema,
  storyCollectionResultSchema,
  registerStoryViewInputSchema,
  registerStoryViewResultSchema,
  storyViewResponseSchema,
  type FetchActiveStoriesInput,
  type FetchProfileStoriesInput,
  type StoryCollectionResult,
  type RegisterStoryViewInput,
  type RegisterStoryViewResult,
} from './schema';

function mapStoryError(status: number): string {
  if (status === 400) return 'Invalid stories request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Stories not found or not accessible.';
  return 'Stories service temporarily unavailable.';
}

function mapStoryViewError(status: number): string {
  if (status === 400) return 'Invalid story view request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Story not found or not accessible.';
  return 'Stories service temporarily unavailable.';
}

async function parseJson(response: Response): Promise<unknown | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchStoryCollection(path: string): Promise<StoryCollectionResult> {
  let response: Response;
  try {
    response = await springFetch(path, {
      method: 'GET',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Stories service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapStoryError(response.status) };
  }

  const payload = await parseJson(response);
  const parsedPayload = storyCollectionBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid stories response payload.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Stories service temporarily unavailable.',
    };
  }

  return storyCollectionResultSchema.parse({
    success: true,
    data: {
      stories: parsedPayload.data.data.stories,
    },
  });
}

export async function fetchActiveStoriesAction(
  input: FetchActiveStoriesInput = {}
): Promise<StoryCollectionResult> {
  const parsedInput = fetchActiveStoriesInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid stories request.' };
  }

  return fetchStoryCollection('/api/priv/stories');
}

export async function fetchProfileStoriesAction(
  input: FetchProfileStoriesInput
): Promise<StoryCollectionResult> {
  const parsedInput = fetchProfileStoriesInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid stories request.' };
  }

  return fetchStoryCollection(`/api/priv/stories/profiles/${parsedInput.data.profileId}`);
}

export async function registerStoryViewAction(
  input: RegisterStoryViewInput
): Promise<RegisterStoryViewResult> {
  const parsedInput = registerStoryViewInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid story view input.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/stories/${parsedInput.data.storyId}/view`, {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Stories service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapStoryViewError(response.status) };
  }

  const payload = await parseJson(response);
  if (!payload) {
    return { success: false, error: 'Unexpected response from stories service.' };
  }

  const parsedPayload = storyViewResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid stories response payload.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Stories service temporarily unavailable.',
    };
  }

  return registerStoryViewResultSchema.parse({
    success: true,
    data: {
      message: parsedPayload.data.message,
    },
  });
}
