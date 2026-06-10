'use server';

import { revalidatePath } from 'next/cache';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { parseJsonSafe } from '@/features/profile/shared';
import { privacyApiResponseSchema, updatePrivacyInputSchema, type UpdatePrivacyInput } from './schema';


export async function updatePrivacyAction(input: UpdatePrivacyInput): Promise<{
  success: boolean;
  data?: { isPrivate: boolean; promotedFollowsCount: number };
  error?: string;
}> {
  const parsed = updatePrivacyInputSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: 'Invalid input.' };
  }

  let response: Response;
  try {
    response = await springFetch('/api/priv/profiles/privacy', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrivate: parsed.data.isPrivate }),
    });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
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
