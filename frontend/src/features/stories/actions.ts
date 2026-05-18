'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  registerStoryViewInputSchema,
  registerStoryViewResultSchema,
  storyViewResponseSchema,
  type RegisterStoryViewInput,
  type RegisterStoryViewResult,
} from './schema';

function mapStoryViewError(status: number): string {
  if (status === 400) return 'Invalid story view request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Story not found or not accessible.';
  return 'Stories service temporarily unavailable.';
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

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
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
