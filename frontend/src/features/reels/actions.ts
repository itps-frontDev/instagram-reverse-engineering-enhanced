'use server';

import { springFetch } from '@/lib/spring-client';
import { SpringAuthError } from '@/lib/spring-error';
import { redirect } from 'next/navigation';
import { getReelsInputSchema, type GetReelsInput, type GetReelsResult } from './schema';

function mapReelError(status: number): string {
  if (status === 401) return 'Non autorizzato.';
  if (status === 400) return 'Parametri non validi.';
  return 'Errore nel recupero dei reels.';
}

export async function getReelsAction(input: GetReelsInput): Promise<GetReelsResult> {
  const parsed = getReelsInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Parametri non validi.' };

  const { limit, excludeIds } = parsed.data;
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (excludeIds.length > 0) {
    params.set('excludeIds', excludeIds.join(','));
  }

  let response: Response | null = null;
  try {
    response = await springFetch(`/api/priv/reels?${params.toString()}`, { method: 'GET' });
  } catch (error) {
    if (error instanceof SpringAuthError) redirect('/login');
    return { success: false, error: 'Servizio reels non raggiungibile.' };
  }

  if (!response.ok) return { success: false, error: mapReelError(response.status) };
  const payload = await response.json();
  return { success: true, data: payload.data };
}
