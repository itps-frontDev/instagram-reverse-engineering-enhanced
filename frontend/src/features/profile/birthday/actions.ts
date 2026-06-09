/**
 * @fileoverview Server Actions per il birthday feature.
 * 
 * Contiene:
 * - getBirthdayAction(): GET da Spring Boot /api/priv/profiles/birthday
 * - updateBirthdayAction(birthday): PUT a Spring Boot /api/priv/profiles/birthday
 * 
 * Entrambi gli action validano la risposta con Zod schema
 * e gestiscono gli errori appropriatamente.
 * 
 * @module features/profile/birthday/actions
 */

'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getAccessTokenCookieName } from '@/lib/auth/backend';
import {
  updateBirthdaySchema,
  birthdayApiResponseSchema,
  type BirthdayResponse,
  type ErrorResponse,
  type BirthdayApiResponse,
} from './schema';

function requireSpringApiBaseUrl(): string {
  const url = process.env.SPRING_API_BASE_URL?.trim();
  if (!url) {
    throw new Error('SPRING_API_BASE_URL is not configured');
  }
  return url.replace(/\/+$/, "");
}

type ProfileApiErrorPayload = {
  success?: false;
  error?: string;
  message?: string;
};

function mapProfileErrorToUserMessage(payload: ProfileApiErrorPayload, fallback: string): string {
  if (payload.error === 'PROFILE_INVALID_AGE') {
    return 'Devi avere almeno 13 anni per usare Instagram';
  }

  if (typeof payload.message === 'string' && payload.message.trim().length > 0) {
    return payload.message;
  }

  return fallback;
}

// ============================================================================
// GET ACTION
// ============================================================================

/**
 * Server Action: Legge la data di nascita dell'utente autenticato.
 * 
 * Chiama GET /api/priv/profiles/birthday sul backend Spring Boot.
 * 
 * @returns BirthdayResponse (success) o ErrorResponse (error)
 */
export async function getBirthdayAction(): Promise<BirthdayResponse | ErrorResponse> {
  
  const SPRING_API_BASE_URL = requireSpringApiBaseUrl();

  try {
    const cookieStore = await cookies();
    const cookieName = getAccessTokenCookieName();
    const accessToken = cookieStore.get(cookieName)?.value;

    if (!accessToken) {
      console.error('[getBirthdayAction] No access token found');
      return { success: false, error: 'Not authenticated' };
    }

    const res = await fetch(`${SPRING_API_BASE_URL}/api/priv/profiles/birthday`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store', // Always fetch fresh from backend
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({})) as ProfileApiErrorPayload;
      console.error('[getBirthdayAction] Backend error:', error);
      return {
        success: false,
        error: mapProfileErrorToUserMessage(error, 'Errore nel recupero della data di nascita'),
      };
    }

    const data = await res.json();

    // Validate response format
    const validated = birthdayApiResponseSchema.parse(data);

    if (!validated.success) {
      return {
        success: false,
        error: validated.error,
      };
    }

    return validated;
  } catch (error) {
    console.error('[getBirthdayAction] Exception:', error);
    return {
      success: false,
      error: 'Internal error fetching birthday',
    };
  }
}

// ============================================================================
// PUT ACTION
// ============================================================================

/**
 * Server Action: Aggiorna la data di nascita dell'utente autenticato.
 * 
 * Chiama PUT /api/priv/profiles/birthday sul backend Spring Boot.
 * 
 * Validazioni:
 * - Input: Zod schema (formato YYYY-MM-DD, non futura)
 * - Backend: età minima 13 anni
 * 
 * Dopo successo, revalida la pagina /accounts/birthday per ricaricare i dati.
 * 
 * @param birthday - Data di nascita in formato ISO YYYY-MM-DD
 * @returns BirthdayResponse (success) o ErrorResponse (error)
 */
export async function updateBirthdayAction(
  birthday: string
): Promise<BirthdayResponse | ErrorResponse> {

  const SPRING_API_BASE_URL = requireSpringApiBaseUrl();

  try {
    // Client-side validation con Zod
    const validated = updateBirthdaySchema.parse({ birthday });

    const cookieStore = await cookies();
    const cookieName = getAccessTokenCookieName();
    const accessToken = cookieStore.get(cookieName)?.value;

    if (!accessToken) {
      console.error('[updateBirthdayAction] No access token found');
      return { success: false, error: 'Not authenticated' };
    }

    const res = await fetch(`${SPRING_API_BASE_URL}/api/priv/profiles/birthday`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      cache: 'no-store',
      body: JSON.stringify({
        birthday: validated.birthday, // Send as YYYY-MM-DD
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({})) as ProfileApiErrorPayload;
      console.error('[updateBirthdayAction] Backend error:', error);
      return {
        success: false,
        error: mapProfileErrorToUserMessage(error, 'Errore durante l\'aggiornamento della data di nascita'),
      };
    }

    const data = await res.json();

    // Validate response format
    const validated_response = birthdayApiResponseSchema.parse(data);

    if (!validated_response.success) {
      return {
        success: false,
        error: validated_response.error,
      };
    }

    // Revalidate the page to refresh cached data
    revalidatePath('/accounts/birthday');

    return validated_response;
  } catch (error) {
    if (error instanceof Error && error.message.includes('validation')) {
      console.error('[updateBirthdayAction] Validation error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }

    console.error('[updateBirthdayAction] Exception:', error);
    return {
      success: false,
      error: 'Internal error updating birthday',
    };
  }
}
