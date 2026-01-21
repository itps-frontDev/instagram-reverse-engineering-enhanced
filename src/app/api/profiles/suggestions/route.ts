/**
 * @fileoverview API per i suggerimenti di profili da seguire
 *
 * Restituisce una lista di profili suggeriti basata su:
 * - Utenti non attualmente seguiti
 * - Utenti popolari (alto numero di follower)
 * - Solo profili pubblici
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

/**
 * GET /api/profiles/suggestions
 * Ottiene i suggerimenti di profili da seguire.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function GET(request: NextRequest) {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ottiene i suggerimenti usando il repository
    const suggestions = await profileRepository.getSuggestions(currentProfile.id, 5);

    return NextResponse.json({
      suggestions,
    });
  } catch (error) {
    console.error('Errore nel recupero dei suggerimenti:', error);
    return NextResponse.json(
      { error: 'Errore durante il recupero dei suggerimenti' },
      { status: 500 }
    );
  }
}
