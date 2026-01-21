/**
 * @fileoverview API per like/unlike commenti
 *
 * POST /api/feed/comments/like
 * Toggle del like su un commento (like se non già messo, unlike altrimenti).
 * 
 * COMPORTAMENTO:
 * - Se l'utente non ha messo like → aggiunge like
 * - Se l'utente ha già messo like → rimuove like (toggle)
 * - Crea notifica per l'autore del commento (se diverso da chi mette like)
 * 
 * OTTIMIZZAZIONI:
 * - Usa soft delete per mantenere lo storico
 * - Re-like riattiva il record esistente invece di crearne uno nuovo
 * 
 * @module api/feed/comments/like
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { commentRepository, notificationRepository } from '@/repositories';

export const runtime = 'nodejs';

/**
 * POST /api/feed/comments/like
 * 
 * Toggle like su un commento.
 * 
 * @body { commentId: number }
 * @returns { success, liked, likes_count }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // 2. Parsing e validazione body
    const { commentId } = await request.json();

    if (!commentId) {
      return NextResponse.json(
        { error: `L'ID commento è richiesto` },
        { status: 400 }
      );
    }

    // 3. Verifica che il commento esista
    const comment = await commentRepository.getById(commentId);
    if (!comment) {
      return NextResponse.json(
        { error: 'Commento non trovato' },
        { status: 404 }
      );
    }

    // 4. Verifica se già messo like
    const isCurrentlyLiked = await commentRepository.hasLiked(commentId, currentProfile.id);

    let liked: boolean;
    let newLikesCount: number;

    if (isCurrentlyLiked) {
      // 5a. Unlike: rimuovi il like
      const result = await commentRepository.unlike(commentId, currentProfile.id);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Errore durante la rimozione del like' },
          { status: 500 }
        );
      }

      // Elimina notifica di like commento
      await notificationRepository.deleteLikeNotification(
        currentProfile.id,
        comment.post_id
      );

      liked = false;
      newLikesCount = result.newLikesCount;
    } else {
      // 5b. Like: aggiungi il like
      const result = await commentRepository.like(commentId, currentProfile.id);
      
      if (!result) {
        return NextResponse.json(
          { error: 'Errore durante l\'aggiunta del like' },
          { status: 500 }
        );
      }

      // Crea notifica (solo se non è il proprio commento)
      if (comment.profile_id !== currentProfile.id) {
        await notificationRepository.create({
          recipient_profile_id: comment.profile_id,
          actor_profile_id: currentProfile.id,
          type: 'like',
          post_id: comment.post_id,
          comment_id: commentId,
        });
      }

      liked = true;
      newLikesCount = result.newLikesCount;
    }

    // 6. Risposta
    return NextResponse.json({
      success: true,
      liked,
      likes_count: newLikesCount,
    });
  } catch (error) {
    console.error('[Comment Like] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
