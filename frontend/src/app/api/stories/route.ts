/**
 * @fileoverview API per gestione storie
 * 
 * Endpoint disponibile:
 * - GET /api/stories - Recupera storie attive (proprie + seguite)
 * 
 * CONCETTO STORIE:
 * Le storie sono contenuti effimeri che scadono dopo 24 ore.
 * Simile alle Instagram Stories, vengono mostrate:
 * - Le proprie storie (sempre visibili)
 * - Storie di profili seguiti (status = 'accepted')
 * - Storie di profili pubblici (is_private = 0)
 * 
 * SCADENZA:
 * expires_at > datetime('now') garantisce che solo storie
 * non scadute vengano restituite.
 * 
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati delle storie.
 * 
 * @module api/stories
 */

import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { storyRepository } from '@/repositories';

// Forza runtime Node.js per accesso al database
export const runtime = 'nodejs';

// ============================================================================
// GET /api/stories
// ============================================================================

/**
 * Recupera le storie attive per l'utente corrente.
 * 
 * Restituisce:
 * - Proprie storie
 * - Storie di profili seguiti (follow accettato)
 * - Storie di profili pubblici
 * 
 * Per ogni storia calcola:
 * - is_liked_by_me: se l'utente ha messo like
 * - is_viewed: se l'utente l'ha già visualizzata
 * 
 * @returns { stories: StoryWithStatus[] }
 */
export async function GET() {
  try {
    const currentProfile = await getCurrentProfile();

    // Se non autenticato, ritorna lista vuota
    // Le storie richiedono autenticazione per vedere quelle dei seguiti
    if (!currentProfile) {
      return NextResponse.json({ stories: [] });
    }

    // Recupera le storie raggruppate per profilo usando il repository
    const storyGroups = await storyRepository.getActiveStoriesGrouped(currentProfile.id);

    // Appiattisci i gruppi in un array singolo di storie
    // (il frontend si aspetta un array di storie, non raggruppate)
    const stories = storyGroups.flatMap(group => group.stories);

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('[Stories] Errore GET:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' }, 
      { status: 500 }
    );
  }
}
