'use server';

import { revalidatePath } from 'next/cache';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';
import { privacyApiResponseSchema, updatePrivacyInputSchema, type UpdatePrivacyInput } from './schema';

const UPDATE_PRIVACY_TIMEOUT_MS = 8_000;

export async function updatePrivacyAction(input: UpdatePrivacyInput): Promise<{
  success: boolean;
  data?: { isPrivate: boolean; promotedFollowsCount: number };
  error?: string;
}> {
  const parsed = updatePrivacyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  const url = buildSpringAuthUrl('/api/priv/profiles/privacy');
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ isPrivate: parsed.data.isPrivate }),
      signal: AbortSignal.timeout(UPDATE_PRIVACY_TIMEOUT_MS),
    });
  } catch {
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = privacyApiResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!response.ok || !parsedPayload.data.success || !parsedPayload.data.data) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Unable to update privacy settings.',
    };
  }

  revalidatePath('/accounts/privacy');
  return {
    success: true,
    data: {
      isPrivate: parsedPayload.data.data.isPrivate,
      promotedFollowsCount: parsedPayload.data.data.promotedFollowsCount,
    },
  };
}
