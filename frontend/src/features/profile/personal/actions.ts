'use server';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';
import {
  personalProfileInputSchema,
  personalProfileResponseSchema,
  type PersonalProfileActionResult,
} from './schema';

export async function updatePersonalProfileAction(input: unknown): Promise<PersonalProfileActionResult> {
  const parsedInput = personalProfileInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  let response: Response;
  try {
    response = await fetch(buildSpringAuthUrl('/api/priv/profiles/personal'), {
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
  const parsedPayload = personalProfileResponseSchema.safeParse(payload);

  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!response.ok || !parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Failed to update personal info.',
    };
  }

  return { success: true };
}
