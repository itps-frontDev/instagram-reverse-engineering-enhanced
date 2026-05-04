/**
 * @fileoverview API per ottenere profilo utente corrente
 *
 * GET /api/auth/me
 * Restituisce il profilo dell'utente attualmente autenticato.
 * 
 * USO TIPICO:
 * - Verificare se l'utente è loggato
 * - Ottenere dati del profilo per la UI (header, sidebar, ecc.)
 * - Inizializzare il context di autenticazione nel frontend
 * 
 * FLUSSO:
 * 1. getCurrentProfile() legge il cookie auth_token
 * 2. Verifica e decodifica il JWT
 * 3. Recupera il profilo dal database
 * 4. Restituisce i dati del profilo
 * 
 * @module api/auth/me
 */

import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta GET per ottenere profilo corrente.
 * 
 * @returns { profile: Profile } o errore 401 se non autenticato
 */
export async function GET() {
  try {
    // Recupera profilo dall'auth helper
    // Questo legge il cookie, verifica il JWT e fa la query al DB
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Converti interi SQLite (0/1) in booleani JavaScript
    const profileData = {
      ...profile,
      is_private: Boolean(profile.is_private),
      is_verified: Boolean(profile.is_verified),
    };

    return NextResponse.json(
      { profile: profileData },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Me] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
