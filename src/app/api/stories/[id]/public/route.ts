/**
 * @fileoverview API per le storie pubbliche di un profilo
 *
 * GET /api/stories/[id]/public - Recupera storie pubbliche senza autenticazione
 *
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati.
 * 
 * @module api/stories/[id]/public
 */

import { NextRequest, NextResponse } from 'next/server';
import { storyRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

/**
 * GET /api/stories/[id]/public
 * Recupera le storie pubbliche di un profilo.
 * 
 * Non richiede autenticazione.
 * Restituisce solo storie di profili pubblici (is_private = 0).
 */
export async function GET(
  req: NextRequest,
  context: { params: { id: string } } | { params: Promise<{ id: string }> }
) {

  // Verifica autenticazione
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json(
      { error: 'Non autorizzato' },
      { status: 401 }
    );
  }

  let params = context.params;
  if (params instanceof Promise) {
    params = await params;
  }
  const { id } = params;
  
  if (!id) {
    return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
  }

  const profileId = parseInt(id, 10);
  if (isNaN(profileId)) {
    return NextResponse.json({ error: 'ID profilo non valido' }, { status: 400 });
  }

  try {
    // Recupera storie pubbliche usando il repository
    const stories = await storyRepository.getPublicStoriesByProfile(profileId);
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('[api/stories/[id]/public] GET error:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
