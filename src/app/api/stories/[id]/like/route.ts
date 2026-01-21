/**
 * @fileoverview API per il like delle storie
 *
 * POST /api/stories/[id]/like - Toggle like su una storia
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

  // Verifica che la storia esista e non sia scaduta
  const storyExists = await storyRepository.existsAndActive(storyId);

  if (!storyExists) {
    return NextResponse.json({ error: 'Storia non trovata o scaduta' }, { status: 404 });
  }

  // Toggle like usando il repository (ritorna true se ha messo like, false se lo ha tolto)
  const liked = await storyRepository.likeStory(storyId, profile.id);

  return NextResponse.json({ liked });
}
