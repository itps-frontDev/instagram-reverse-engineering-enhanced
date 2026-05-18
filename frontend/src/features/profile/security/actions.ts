'use server';

import { revalidatePath } from 'next/cache';

import { buildSpringAuthUrl } from '@/lib/auth/backend';
import { getProfileAccessToken, parseJsonSafe } from '@/features/profile/shared';
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
  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  let response: Response;
  try {
    response = await fetch(buildSpringAuthUrl('/api/priv/profiles/security'), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(SECURITY_TIMEOUT_MS),
    });
  } catch {
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

  const accessToken = await getProfileAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Authentication required.' };
  }

  let response: Response;
  try {
    response = await fetch(buildSpringAuthUrl('/api/priv/profiles/security'), {
      method: 'PUT',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(parsedInput.data),
      signal: AbortSignal.timeout(SECURITY_TIMEOUT_MS),
    });
  } catch {
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
