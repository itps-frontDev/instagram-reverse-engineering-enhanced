/**
 * @fileoverview API per commentare un post
 * 
 * POST /api/posts/[postId]/comment
 * Aggiunge un commento al post specificato.
 * 
 * PROCESSO:
 * 1. Verifica autenticazione utente
 * 2. Valida testo commento (non vuoto)
 * 3. Inserisce commento tramite repository
 * 4. Incrementa contatore comments_count del post
 * 5. Crea notifica per il proprietario del post (se diverso)
 * 
 * @module api/posts/[postId]/comment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { commentRepository, postRepository } from '@/repositories';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per aggiungere commento.
 * 
 * @param request - Request con body JSON { text: string }
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

    // Estrai parametri
    const { postId } = await params;
    const postIdNum = parseInt(postId);
    
    // Parse body JSON
    const body = await request.json();
    const { text } = body;

    // Validazione: testo richiesto e non vuoto
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Testo commento richiesto' }, 
        { status: 400 }
      );
    }

    // Recupera il post per verificare esistenza e proprietario
    const post = await postRepository.findById(postIdNum);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    // Aggiungi commento tramite repository
    // (gestisce anche incremento contatore comments_count)
    const comment = await commentRepository.create(
      postIdNum,
      profileId,
      text.trim()
    );

    // TODO: gestire lato BE — dispatch notifica comment
    // if (post.profile_id !== profileId) {
    //   dispatchNotificationToSpring(request, {
    //     recipientProfileId: post.profile_id,
    //     senderProfileId: profileId,
    //     type: 'comment',
    //     referenceType: 'comment',
    //     referenceId: comment.id,
    //   });
    // }

    return NextResponse.json({ message: 'Commento aggiunto con successo' });
  } catch (error) {
    console.error('[Comments] Errore aggiunta commento:', error);
    return NextResponse.json(
      { error: 'Impossibile aggiungere commento' }, 
      { status: 500 }
    );
  }
}
