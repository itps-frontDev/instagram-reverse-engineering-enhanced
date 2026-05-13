/**
 * @fileoverview API per rimuovere like da un post
 * 
 * POST /api/posts/[postId]/unlike
 * Rimuove il like dell'utente corrente dal post.
 * 
 * PROCESSO:
 * 1. Verifica autenticazione
 * 2. Soft delete del like (imposta deleted_at)
 * 3. Decrementa contatore likes_count del post
 * 4. Elimina notifica like precedente
 * 
 * @module api/posts/[postId]/unlike
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { postRepository } from '@/repositories';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per rimuovere like.
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

    // Rimuove il like tramite repository
    // (gestisce soft delete e decremento contatore automaticamente)
    await postRepository.unlike(postIdNum, profileId);

    // TODO: gestire lato BE — delete notifica like_post
    // const post = await postRepository.findById(postIdNum);
    // if (post) {
    //   deleteNotificationsByFilterInSpring(request, {
    //     recipientProfileId: post.profile_id,
    //     senderProfileId: profileId,
    //     type: 'like_post',
    //     referenceType: 'post',
    //     referenceId: postIdNum,
    //   });
    // }

    return NextResponse.json({ message: 'Like rimosso con successo' });
  } catch (error) {
    console.error('[Likes] Errore rimozione like:', error);
    return NextResponse.json(
      { error: 'Impossibile rimuovere like' }, 
      { status: 500 }
    );
  }
}
