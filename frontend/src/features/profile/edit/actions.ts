'use server';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';
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

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  let response: Response;
  try {
    response = await fetch(buildSpringAuthUrl('/api/priv/profiles/edit'), {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parsedInput.data),
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
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
