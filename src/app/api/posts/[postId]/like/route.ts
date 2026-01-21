/**
 * @fileoverview API per mettere like a un post
 * 
 * POST /api/posts/[postId]/like
 * Aggiunge un like al post specificato.
 * 
 * PROCESSO:
 * 1. Verifica autenticazione utente
 * 2. Verifica che l'utente non abbia già messo like
 * 3. Inserisce record nella tabella `likes`
 * 4. Incrementa contatore `likes_count` del post
 * 5. Crea notifica per il proprietario del post (se diverso)
 * 
 * PATTERN LIKE POLIMORFICO:
 * La tabella `likes` usa un pattern polimorfico:
 * - likeable_type: 'post' | 'comment' | 'story'
 * - likeable_id: ID dell'entità
 * Questo permette di usare una sola tabella per tutti i tipi di like.
 * 
 * GESTIONE DUPLICATI:
 * - Prima di creare la notifica, eliminiamo eventuali notifiche
 *   duplicate esistenti per evitare spam.
 * 
 * @module api/posts/[postId]/like
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { postRepository, notificationRepository } from '@/repositories';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per aggiungere like a un post.
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

    // Estrai e converti postId
    const { postId } = await params;
    const postIdNum = parseInt(postId);

    // Verifica se l'utente ha già messo like (tramite repository)
    const alreadyLiked = await postRepository.hasLiked(postIdNum, profileId);
    if (alreadyLiked) {
      // Ritorna successo senza errore (comportamento idempotente)
      return NextResponse.json({ message: 'Like già presente' });
    }

    // Recupera il post per verificare il proprietario
    const post = await postRepository.findById(postIdNum);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    // Aggiungi like tramite repository
    // (gestisce anche incremento contatore likes_count)
    await postRepository.like(postIdNum, profileId);

    // Crea notifica (solo se non è like al proprio post)
    if (post.profile_id !== profileId) {
      // Usa l'helper specifico per notifiche like
      // Questo gestisce anche la rimozione di notifiche duplicate
      await notificationRepository.createLikeNotification(
        post.profile_id,
        profileId,
        postIdNum
      );
    }

    return NextResponse.json({ message: 'Like aggiunto con successo' });
  } catch (error) {
    console.error('[Likes] Errore aggiunta like:', error);
    return NextResponse.json(
      { error: 'Impossibile aggiungere like' }, 
      { status: 500 }
    );
  }
}
