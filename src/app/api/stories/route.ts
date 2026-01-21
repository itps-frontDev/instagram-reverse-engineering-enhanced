/**
 * @fileoverview API per gestione storie
 * 
 * Endpoint disponibili:
 * - GET  /api/stories - Recupera storie attive (proprie + seguite)
 * - POST /api/stories - Registra visualizzazione storia
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
 * VISUALIZZAZIONI:
 * Quando un utente visualizza una storia:
 * 1. Viene creato un record in story_views
 * 2. Il contatore views_count viene incrementato
 * 
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati delle storie.
 * 
 * @module api/stories
 */

import { NextResponse, NextRequest } from 'next/server';
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

// ============================================================================
// POST /api/stories
// ============================================================================

/**
 * Registra la visualizzazione di una storia.
 * 
 * Processo:
 * 1. Verifica autenticazione
 * 2. Valida story_id
 * 3. Verifica che la storia esista e sia accessibile
 * 4. Se non già visualizzata, crea record e incrementa contatore
 * 
 * IDEMPOTENZA:
 * Se la storia è già stata visualizzata, non crea duplicati.
 * 
 * @param request - Body JSON { story_id: number }
 * @returns { success: true, message: string }
 */
export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    // Autenticazione richiesta
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Parse body e valida
    const { story_id } = await request.json();

    if (!story_id) {
      return NextResponse.json(
        { error: 'story_id mancante' },
        { status: 400 }
      );
    }

    // Verifica che la storia esista e sia accessibile usando il repository
    const story = await storyRepository.findAccessibleById(story_id, currentProfile.id);

    // Storia non trovata o non accessibile
    if (!story) {
      return NextResponse.json(
        { error: 'Storia non trovata o non accessibile' },
        { status: 404 }
      );
    }

    // Registra la visualizzazione (idempotente)
    const wasNewView = await storyRepository.recordView(story_id, currentProfile.id);

    return NextResponse.json({
      success: true,
      message: wasNewView ? 'Visualizzazione registrata' : 'Già visualizzata',
    });
  } catch (error) {
    console.error('[Stories] Errore POST:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

