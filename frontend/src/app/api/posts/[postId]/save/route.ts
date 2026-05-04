/**
 * @fileoverview API per salvare un post
 * 
 * POST /api/posts/[postId]/save
 * Salva un post nella collezione personale dell'utente.
 * 
 * FUNZIONALITÀ "SALVA POST":
 * Simile ai segnalibri, permette agli utenti di salvare post
 * per visualizzarli successivamente nella sezione "Salvati"
 * del proprio profilo.
 * 
 * COMPORTAMENTO IDEMPOTENTE:
 * Se il post è già salvato, ritorna successo senza errore.
 * 
 * @module api/posts/[postId]/save
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { postRepository } from '@/repositories';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per salvare un post.
 * 
 * @param request - Request Next.js
 * @param params - Contiene postId
 * @returns Messaggio di successo o errore
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verifica autenticazione
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    const { postId } = await params;
    const postIdNum = parseInt(postId);

    // Verifica se già salvato tramite repository (comportamento idempotente)
    const alreadySaved = await postRepository.isSaved(postIdNum, profileId);
    if (alreadySaved) {
      return NextResponse.json({ message: 'Post già salvato' });
    }

    // Salva il post tramite repository
    await postRepository.save(postIdNum, profileId);

    return NextResponse.json({ message: 'Post salvato con successo' });
  } catch (error) {
    console.error('[Save] Errore salvataggio post:', error);
    return NextResponse.json(
      { error: 'Impossibile salvare il post' }, 
      { status: 500 }
    );
  }
}
