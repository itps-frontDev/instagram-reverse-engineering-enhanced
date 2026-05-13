/**
 * @fileoverview API per il like delle storie
 *
 * POST /api/stories/[id]/like - Toggle like su una storia
 *
 * PROCESSO:
 * 1. Verifica autenticazione utente
 * 2. Verifica che la storia esista e sia attiva
 * 3. Toggle del like (aggiungi o rimuovi)
 * 4. Crea/elimina notifica per il proprietario della storia (se diverso)
 *
 * PATTERN REPOSITORY:
 * Usa StoryRepository per accesso centralizzato ai dati.
 * 
 * @module api/stories/[id]/like
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { storyRepository } from '@/repositories';

/**
 * POST /api/stories/[id]/like
 * Toggle del like su una storia.
 * 
 * Se già liked, rimuove il like. Altrimenti lo aggiunge.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;
  const storyId = parseInt(id);
  if (isNaN(storyId)) {
    return NextResponse.json({ error: 'ID storia non valido' }, { status: 400 });
  }

  // Recupera la storia per verificare esistenza e proprietario
  const story = await storyRepository.findById(storyId);

  if (!story) {
    return NextResponse.json({ error: 'Storia non trovata' }, { status: 404 });
  }

  // Verifica che la storia sia ancora attiva
  const isActive = await storyRepository.existsAndActive(storyId);
  if (!isActive) {
    return NextResponse.json({ error: 'Storia scaduta' }, { status: 404 });
  }

  // Toggle like usando il repository (ritorna true se ha messo like, false se lo ha tolto)
  const liked = await storyRepository.likeStory(storyId, profile.id);

  // TODO: gestire lato BE — dispatch/delete notifica like_story
  // if (story.profile_id !== profile.id) {
  //   if (liked) {
  //     dispatchNotificationToSpring(req, {
  //       recipientProfileId: story.profile_id,
  //       senderProfileId: profile.id,
  //       type: 'like_story',
  //       referenceType: 'story',
  //       referenceId: storyId,
  //     });
  //   } else {
  //     deleteNotificationsByFilterInSpring(req, {
  //       recipientProfileId: story.profile_id,
  //       senderProfileId: profile.id,
  //       type: 'like_story',
  //       referenceType: 'story',
  //       referenceId: storyId,
  //     });
  //   }
  // }

  return NextResponse.json({ liked });
}
