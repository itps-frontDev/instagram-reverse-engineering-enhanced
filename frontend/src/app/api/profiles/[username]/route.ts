/**
 * @fileoverview API per recupero profilo tramite username
 *
 * GET /api/profiles/[username]
 * Restituisce informazioni complete di un profilo dato il suo username.
 * Questo è l'endpoint principale per il caricamento delle pagine profilo.
 * 
 * FUNZIONALITÀ PRINCIPALI:
 * 1. Recupera dati base del profilo (username, bio, contatori)
 * 2. Calcola flag dinamici (has_reels, has_active_story, etc.)
 * 3. Tiene conto dell'utente corrente per storie non viste
 * 4. Implementa soft delete (deleted_at IS NULL)
 * 
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * Il metodo findByUsernameWithDetails incapsula tutta la logica complessa.
 * 
 * NOTA SUL CACHING:
 * La risposta include header Cache-Control per caching lato client:
 * - s-maxage=60: CDN può tenere in cache per 60 secondi
 * - stale-while-revalidate=120: può servire stale mentre ricarica
 * 
 * @module api/profiles/[username]
 */

import { NextRequest, NextResponse } from 'next/server';
import { Profile, GetProfileResponse } from '@/types/profile';
import { getCurrentProfile, getCurrentProfileId } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// Forza runtime Node.js (necessario per accesso DB)
export const runtime = 'nodejs';

// ============================================================================
// GET /api/profiles/[username]
// ============================================================================

/**
 * Recupera i dati di un profilo dato l'username.
 * 
 * Vantaggi del Repository Pattern:
 * 1. Codice API più pulito e leggibile
 * 2. Logica SQL riutilizzabile
 * 3. Più facile da testare (si può mockare il repository)
 * 4. Separazione delle responsabilità
 *
 * @param request - Oggetto request Next.js
 * @param params - Parametri route contenenti username
 * @returns Dati profilo o risposta errore
 *
 * @example
 * // Recupera profilo
 * const response = await fetch('/api/profiles/johndoe');
 * const { profile } = await response.json();
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {

    // Ottiene il profilo corrente autenticato
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // In Next.js 15+ i params sono Promise (segment dinamici)
    const { username } = await params;

    // Validazione parametro username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username richiesto' },
        { status: 400 }
      );
    }

    /**
     * Ottiene l'ID del profilo corrente dall'autenticazione.
     * Se non autenticato, ritorna null.
     * 
     * Usato per personalizzare i dati del profilo richiesto,
     * ad esempio per calcolare se ci sono storie attive non viste.
     */
    const currentProfileId = await getCurrentProfileId();
    
    
    /**
     * Il metodo findByUsernameWithDetails incapsula:
     * - Query base profilo
     * - Subquery per has_reels
     * - Subquery per has_any_active_story
     * - Subquery per has_active_story (considera viewer)
     * - Subquery per has_viewed_story
     * - Conversione booleani SQLite -> JavaScript
     */
    const profile = await profileRepository.findByUsernameWithDetails(
      username, 
      currentProfileId
    );

    // Profilo non trovato
    if (!profile) {
      return NextResponse.json(
        { error: 'Profilo non trovato' },
        { status: 404 }
      );
    }

    // Prepara risposta con tipo definito
    const response: GetProfileResponse = {
      profile: profile as Profile,
    };

    // Restituisce con header di cache per ottimizzare performance
    return NextResponse.json(response, {
      status: 200,
      headers: {
        // Cache-Control per CDN e browser
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('[Profiles] Errore recupero profilo:', error);

    return NextResponse.json(
      {
        error: 'Errore interno del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
