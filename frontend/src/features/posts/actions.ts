'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  postSaveBackendResponseSchema,
  togglePostSaveInputSchema,
  togglePostSaveResultSchema,
  type TogglePostSaveInput,
  type TogglePostSaveResult,
} from './schema';

function mapPostSaveError(status: number): string {
  if (status === 400) return 'Invalid post save request.';
  if (status === 401) return 'Session expired, please log in again.';
  if (status === 404) return 'Post not found.';
  return 'Posts service temporarily unavailable.';
}

export async function togglePostSaveAction(input: TogglePostSaveInput): Promise<TogglePostSaveResult> {
  const parsedInput = togglePostSaveInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid post save input.' };
  }

  let response: Response;
  try {
    response = await springFetch(`/api/priv/posts/${parsedInput.data.postId}/save-toggle`, {
      method: 'POST',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Session expired, please log in again.' };
    }
    return { success: false, error: 'Posts service is unreachable.' };
  }

  if (!response.ok) {
    return { success: false, error: mapPostSaveError(response.status) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'Unexpected response from posts service.' };
  }

  const parsedPayload = postSaveBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid posts response payload.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Posts service temporarily unavailable.',
    };
  }

  return togglePostSaveResultSchema.parse({
    success: true,
    data: {
      saved: parsedPayload.data.data.saved,
    },
  });
}
