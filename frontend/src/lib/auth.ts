/**
 * @fileoverview Utilità di autenticazione
 *
 * Questo file fornisce funzioni di autenticazione usando token JWT memorizzati in cookie HTTP-only.
 *
 * @module lib/auth
 */

import { cookies } from 'next/headers';
import { queryOne } from '@/lib/db';
import { Profile } from '@/types/profile';
import { verifyToken, type TokenPayload } from '@/lib/jwt';

// ============================================================================
// COSTANTI
// ============================================================================

export const AUTH_COOKIE_NAME = 'authToken';

// ============================================================================
// TIPI
// ============================================================================

/**
 * Informazioni di base dell'utente dalla tabella users
 */
export interface User {
  id: number;
  email: string | null;
  phone_number: string | null;
}

// ============================================================================
// FUNZIONI DI AUTENTICAZIONE
// ============================================================================

/**
 * Ottiene l'utente autenticato corrente dal token JWT.
 *
 * Legge l'authToken dai cookie HTTP-only, lo verifica e recupera i dati utente.
 *
 * @returns L'utente corrente o null se non autenticato
 *
 * @example
 * // In una route API
 * const user = await getCurrentUser();
 * if (!user) {
 *   return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
 * }
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    // Verifica e decodifica il token JWT
    const payload = await verifyToken(token);
    if (!payload) {
      return null;
    }

    // Recupera l'utente dal database
    const user = await queryOne<User>(
      `SELECT id, email, phone_number
       FROM users
       WHERE id = ? AND deleted_at IS NULL`,
      [payload.id]
    );

    return user || null;
  } catch (error) {
    console.error('[Auth] Errore nel recupero dell\'utente corrente:', error);
    return null;
  }
}

/**
 * Ottiene il profilo dell'utente autenticato corrente.
 *
 * Recupera il profilo associato all'utente autenticato dal token JWT.
 *
 * @returns Il profilo dell'utente corrente o null se non autenticato
 *
 * @example
 * // In una route API
 * const currentProfile = await getCurrentProfile();
 * if (!currentProfile) {
 *   return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
 * }
 * console.log(`Utente corrente: ${currentProfile.username}`);
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return null;
    }

    const profile = await queryOne<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified,
        followers_count, following_count, posts_count,
        created_at, updated_at
       FROM profiles
       WHERE user_id = ? AND deleted_at IS NULL`,
      [user.id]
    );

    return profile || null;
  } catch (error) {
    console.error('[Auth] Errore nel recupero del profilo corrente:', error);
    return null;
  }
}

/**
 * Verifica se un utente è autenticato.
 *
 * @returns true se l'utente è autenticato, false altrimenti
 *
 * @example
 * // In un componente server
 * const isAuth = await isAuthenticated();
 * if (!isAuth) {
 *   redirect('/login');
 * }
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Ottiene l'ID dell'utente corrente.
 *
 * @returns L'ID utente o null se non autenticato
 *
 * @example
 * // Controllo rapido dell'ID utente
 * const userId = await getCurrentUserId();
 * if (!userId) {
 *   return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
 * }
 */
export async function getCurrentUserId(): Promise<number | null> {
  const user = await getCurrentUser();
  return user?.id || null;
}

/**
 * Ottiene l'ID del profilo dell'utente corrente.
 *
 * @returns L'ID del profilo o null se non autenticato
 *
 * @example
 * // Verifica se l'utente possiede una risorsa
 * const currentProfileId = await getCurrentProfileId();
 * if (currentProfileId === resourceOwnerId) {
 *   // Consenti modifica
 * }
 */
export async function getCurrentProfileId(): Promise<number | null> {
  const profile = await getCurrentProfile();
  return profile?.id || null;
}

/**
 * Ottiene il payload del token JWT senza recuperare i dati utente.
 * Più veloce di getCurrentUser() quando serve solo l'informazione di base dal token.
 *
 * @returns Il payload del token o null se non autenticato
 *
 * @example
 * // Controllo rapido dell'ID utente senza query DB
 * const payload = await getTokenPayload();
 * if (payload) {
 *   console.log('ID Utente:', payload.id);
 * }
 */
export async function getTokenPayload(): Promise<TokenPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    return await verifyToken(token);
  } catch (error) {
    console.error('[Auth] Errore nel recupero del payload del token:', error);
    return null;
  }
}
