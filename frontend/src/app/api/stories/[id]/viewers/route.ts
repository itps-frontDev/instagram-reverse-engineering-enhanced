/**
 * @fileoverview API per ottenere i visualizzatori di una storia
 *
 * GET /api/stories/[id]/viewers - Lista di chi ha visto la storia
 *
 * Solo il proprietario della storia può vedere questa lista.
 *
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati.
 * 
 * @module api/stories/[id]/viewers
 */

import { NextResponse, NextRequest } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { storyRepository } from '@/repositories';

/**
 * GET /api/stories/[id]/viewers
 * Recupera la lista degli utenti che hanno visualizzato la storia.
 * 
 * Accessibile solo dal proprietario della storia.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const storyId = parseInt(id, 10);

    if (!storyId) {
      return NextResponse.json(
        { error: 'ID storia non valido' },
        { status: 400 }
      );
    }

    // Verifica che la storia appartenga all'utente corrente
    const isOwner = await storyRepository.isOwner(storyId, currentProfile.id);

    if (!isOwner) {
      return NextResponse.json(
        { error: 'Storia non trovata o non di tua proprietà' },
        { status: 404 }
      );
    }

    // Recupera i visualizzatori usando il repository
    const viewers = await storyRepository.getViewers(storyId);

    return NextResponse.json({
      viewers,
      total_views: viewers.length,
    });
  } catch (error) {
    console.error('[api/stories/[id]/viewers] GET error', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
