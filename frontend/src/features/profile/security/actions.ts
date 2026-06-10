'use server';

import { revalidatePath } from 'next/cache';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { parseJsonSafe } from '@/features/profile/shared';
import {
  getSecurityResponseSchema,
  updateSecurityInputSchema,
  updateSecurityResponseSchema,
  type UpdateSecurityInput,
} from './schema';

const SECURITY_TIMEOUT_MS = 8_000;

export async function getSecurityDataAction(): Promise<{
  success: boolean;
  data?: { email: string | null; phoneNumber: string | null };
  error?: string;
}> {
  let response: Response;
  try {
    response = await springFetch('/api/priv/profiles/security');
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = getSecurityResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!response.ok || !parsedPayload.data.success || !parsedPayload.data.data) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Unable to load security data.',
    };
  }

  return {
    success: true,
    data: {
      email: parsedPayload.data.data.email,
      phoneNumber: parsedPayload.data.data.phoneNumber,
    },
  };
}

export async function updateSecurityAction(input: UpdateSecurityInput): Promise<{
  success: boolean;
  data?: { email: string | null; phoneNumber: string | null };
  error?: string;
}> {
  const parsedInput = updateSecurityInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: parsedInput.error.issues[0]?.message || 'Invalid input.' };
  }

  let response: Response;
  try {
    response = await springFetch('/api/priv/profiles/security', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsedInput.data),
    });
  } catch (e) {
    if (e instanceof SpringAuthError) return { success: false, error: 'Authentication required.' };
    return { success: false, error: 'Service unavailable.' };
  }

  const payload = await parseJsonSafe(response);
  const parsedPayload = updateSecurityResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Invalid response payload.' };
  }

  if (!response.ok || !parsedPayload.data.success || !parsedPayload.data.data) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Unable to update security settings.',
    };
  }

  revalidatePath('/accounts/security');
  return {
    success: true,
    data: {
      email: parsedPayload.data.data.email,
      phoneNumber: parsedPayload.data.data.phoneNumber,
    },
  };
}
