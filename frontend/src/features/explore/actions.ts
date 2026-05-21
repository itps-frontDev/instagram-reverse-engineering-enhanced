'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import {
  exploreBackendResponseSchema,
  exploreInputSchema,
  type ExploreActionResult,
  type ExploreInput,
} from './schema';

function mapExploreError(status: number): string {
  if (status === 400) return 'Parametri explore non validi.';
  if (status === 401) return 'Sessione scaduta, effettua di nuovo il login.';
  return 'Servizio explore temporaneamente non disponibile.';
}

export async function fetchExploreAction(input: ExploreInput): Promise<ExploreActionResult> {
  const parsedInput = exploreInputSchema.safeParse(input);
  if (!parsedInput.success) {
    return { success: false, error: 'Parametri explore non validi.' };
  }

  const params = new URLSearchParams({
    limit: String(parsedInput.data.limit),
    offset: String(parsedInput.data.offset),
  });

  let response: Response;
  try {
    response = await springFetch(`/api/priv/explore?${params.toString()}`, {
      method: 'GET',
    });
  } catch (error) {
    if (error instanceof SpringAuthError) {
      return { success: false, error: 'Sessione scaduta, effettua di nuovo il login.' };
    }
    return { success: false, error: 'Servizio explore non raggiungibile.' };
  }

  if (!response.ok) {
    return { success: false, error: mapExploreError(response.status) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { success: false, error: 'Payload explore non valido.' };
  }

  const parsedPayload = exploreBackendResponseSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return { success: false, error: 'Payload explore non valido.' };
  }

  if (!parsedPayload.data.success) {
    return {
      success: false,
      error: parsedPayload.data.message || parsedPayload.data.error || 'Servizio explore temporaneamente non disponibile.',
    };
  }

  return {
    success: true,
    data: parsedPayload.data.data,
  };
}
