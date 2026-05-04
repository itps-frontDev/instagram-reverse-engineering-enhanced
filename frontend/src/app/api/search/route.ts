/**
 * @fileoverview API per la Ricerca
 *
 * Cerca profili in base a username o nome completo.
 * Supporta ricerca di account (in futuro: hashtag e luoghi).
 * 
 * STRATEGIA DI RICERCA:
 * 1. Usa LIKE con pattern %query% per match parziale
 * 2. Ordina per rilevanza:
 *    - Match esatto username = priorità 0
 *    - Username inizia con query = priorità 1  
 *    - Altri match = priorità 2
 * 3. A parità, ordina per follower (profili popolari prima)
 * 
 * NOTA: Per grandi dataset, si userebbe un motore di ricerca
 * dedicato come Elasticsearch o Meilisearch.
 *
 * @module api/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// GET /api/search?q=query&type=account
// ============================================================================

/**
 * Cerca utenti per username o nome completo.
 * 
 * Query params:
 * - q: testo da cercare (obbligatorio)
 * - type: tipo di ricerca, default 'account'
 *
 * @param request - Oggetto richiesta Next.js
 * @returns Array di profili trovati
 *
 * @example
 * // Cerca utenti che contengono "john"
 * const response = await fetch('/api/search?q=john&type=account');
 * const { results } = await response.json();
 */
export async function GET(request: NextRequest) {
  try {
    // Ottiene il profilo corrente (può essere null se non autenticato)
    const currentProfile = await getCurrentProfile();
    
    // Estrae i parametri di ricerca dalla query string
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'account';

    // Se query vuota, restituisci array vuoto
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { results: [] },
        { status: 200 }
      );
    }

    // Per ora supportiamo solo la ricerca di account
    // TODO: Implementare ricerca hashtag e luoghi (feat. futura)
    if (type !== 'account') {
      return NextResponse.json(
        { results: [] },
        { status: 200 }
      );
    }

    // Usa il repository per la ricerca con stato di follow
    // Il metodo gestisce internamente:
    // - Pattern matching case-insensitive
    // - Ordinamento per rilevanza
    // - Subquery per is_following se utente autenticato
    const results = await profileRepository.searchWithFollowStatus(
      query,
      currentProfile?.id ?? null,
      20 // limite risultati
    );

    return NextResponse.json(
      { results },
      { status: 200 }
    );
  } catch (error) {
    console.error('Errore nella ricerca profili:', error);
    return NextResponse.json(
      { error: 'Errore nella ricerca' },
      { status: 500 }
    );
  }
}
