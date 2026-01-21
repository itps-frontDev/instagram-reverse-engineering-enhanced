/**
 * @fileoverview API per rimuovere salvataggio di un post
 * 
 * POST /api/posts/[postId]/unsave
 * Rimuove un post dalla collezione salvati dell'utente.
 * 
 * SOFT DELETE:
 * Il repository usa soft delete, impostando deleted_at.
 * Questo permette tracciamento storico e analytics.
 * 
 * COMPORTAMENTO IDEMPOTENTE:
 * Se il post non è salvato, l'operazione ha comunque successo.
 * 
 * @module api/posts/[postId]/unsave
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { postRepository } from '@/repositories/PostRepository';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per rimuovere salvataggio.
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

    // Rimuove salvataggio tramite repository (soft delete)
    await postRepository.unsave(postIdNum, profileId);

    return NextResponse.json({ message: 'Salvataggio rimosso con successo' });
  } catch (error) {
    console.error('[Save] Errore rimozione salvataggio:', error);
    return NextResponse.json(
      { error: 'Impossibile rimuovere salvataggio' }, 
      { status: 500 }
    );
  }
}
