'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  feedBackendResponseSchema,
  feedInputSchema,
  type FeedActionResult,
  type FeedInput,
} from './schema';

function mapFeedError(status: number): string {
  if (status === 400) return 'Parametri feed non validi.';
  if (status === 401) return 'Sessione scaduta, effettua di nuovo il login.';
  return 'Servizio feed temporaneamente non disponibile.';
}

export async function fetchFeedAction(input: FeedInput): Promise<FeedActionResult> {
  const parsedInput = feedInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Parametri feed non validi.' };
  }

  const params = new URLSearchParams({
    limit: String(parsedInput.data.limit),
    offset: String(parsedInput.data.offset),
  });

  let response: Response;
  try {
    response = await springFetch(`/api/priv/feed?${params.toString()}`, {
      method: 'GET',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Sessione scaduta, effettua di nuovo il login.' };
    }
    return { success: false, error: 'Servizio feed non raggiungibile.' };
  }

  if (!response.ok) {
    return { success: false, error: mapFeedError(response.status) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'Payload feed non valido.' };
  }

  const parsedPayload = feedBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Payload feed non valido.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Servizio feed temporaneamente non disponibile.',
    };
  }

  return {
    success: true,
    data: parsedPayload.data.data,
  };
}
