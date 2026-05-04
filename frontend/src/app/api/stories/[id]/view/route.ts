/**
 * @fileoverview API per registrare la visualizzazione di una storia
 *
 * POST /api/stories/[id]/view - Registra una view e incrementa il contatore
 *
 * LOGICA:
 * - Verifica che la storia esista e non sia scaduta
 * - Permette visualizzazione solo per storie di profili seguiti o proprie
 * - Registra la view solo la prima volta (no duplicati)
 * - Incrementa views_count sulla storia
 *
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati.
 * 
 * @module api/stories/[id]/view
 */

import { NextResponse, NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { storyRepository } from '@/repositories';

/**
 * POST /api/stories/[id]/view
 * Registra una visualizzazione della storia.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // -------------------------------------------------------------------------
    // Autenticazione: ottiene il profilo corrente dal token JWT
    // -------------------------------------------------------------------------
    const currentProfile = await getCurrentProfile();
    
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // Validazione parametro ID
    // -------------------------------------------------------------------------
    const storyId = Number(id);
    if (Number.isNaN(storyId)) {
      return NextResponse.json(
        { error: 'ID storia non valido' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // Verifica che la storia esista, sia attiva e sia accessibile
    // (da profili seguiti o propria storia)
    // -------------------------------------------------------------------------
    const story = await storyRepository.findAccessibleById(storyId, currentProfile.id);

    if (!story) {
      return NextResponse.json(
        { error: 'Storia non trovata o non accessibile' },
        { status: 404 }
      );
    }

    // -------------------------------------------------------------------------
    // Registra la view (idempotente - non crea duplicati)
    // -------------------------------------------------------------------------
    const wasNewView = await storyRepository.recordView(storyId, currentProfile.id);

    return NextResponse.json({
      ok: true,
      message: wasNewView ? 'Visualizzazione registrata' : 'Già visualizzata',
    });
  } catch (error) {
    console.error('[api/stories/[id]/view] Errore POST:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
