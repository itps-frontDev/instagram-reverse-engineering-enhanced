'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { parseJsonSafe } from '@/features/profile/shared';
import {
  editProfileInputSchema,
  editProfileResponseSchema,
  type EditProfileActionResult,
} from './schema';

export async function editProfileAction(input: unknown): Promise<EditProfileActionResult> {
  const parsedInput = editProfileInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid input.' };
  }

  let response: Response;
  try {
    response = await springFetch('/api/priv/profiles/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedInput.data),
    });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = editProfileResponseSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!response.ok || !parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Failed to update profile.',
    };
  }

  return { success: true };
}
