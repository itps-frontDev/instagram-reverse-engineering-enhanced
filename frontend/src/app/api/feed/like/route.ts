/**
 * @fileoverview API per mettere/rimuovere like ai post
 *
 * POST /api/feed/like
 * Toggle del like su un post (mette like se non presente, rimuove se già presente)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { postRepository, notificationRepository } from '@/repositories';
import type { LikePostRequest, LikePostResponse } from '@/types/feed';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parsing body
    const body: LikePostRequest = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Id post richiesto' },
        { status: 400 }
      );
    }

    // Recupera il post tramite repository
    const post = await postRepository.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    // Verifica se ha già il like attivo
    const alreadyLiked = await postRepository.hasLiked(postId, currentProfile.id);

    let liked: boolean;
    let newLikesCount: number;

    if (alreadyLiked) {
      // Rimuove il like (soft delete)
      await postRepository.unlike(postId, currentProfile.id);
      
      // Elimina notifica di like
      await notificationRepository.deleteLikeNotification(
        currentProfile.id,
        postId,
        'post'
      );
      
      liked = false;
      newLikesCount = Math.max(0, post.likes_count - 1);
    } else {
      // Aggiunge il like (o ri-attiva se era stato cancellato)
      await postRepository.like(postId, currentProfile.id);
      
      // Crea notifica (solo se non è like al proprio post)
      if (post.profile_id !== currentProfile.id) {
        await notificationRepository.createLikeNotification(
          post.profile_id,
          currentProfile.id,
          postId
        );
      }
      
      liked = true;
      newLikesCount = post.likes_count + 1;
    }

    const response: LikePostResponse = {
      success: true,
      liked,
      likes_count: newLikesCount,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Like] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
