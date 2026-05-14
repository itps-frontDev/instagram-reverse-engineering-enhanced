/**
 * @fileoverview API dei commenti
 *
 * GET /api/feed/comments?postId=123&limit=20&offset=0
 * Restituisce i commenti di un post.
 *
 * POST /api/feed/comments
 * Crea un nuovo commento su un post.
 * 
 * FUNZIONALITÀ:
 * - Lista commenti con info profilo autore
 * - Stato storie attive dell'autore
 * - Stato like del viewer
 * - Supporto risposte (commenti nidificati)
 * - Notifiche automatiche al proprietario del post
 * 
 * @module api/feed/comments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { commentRepository } from '@/repositories';
import type {
  Comment,
  CreateCommentRequest,
  CreateCommentResponse,
  GetCommentsResponse,
} from '@/types/feed';

export const runtime = 'nodejs';

/**
 * GET /api/feed/comments
 * 
 * Restituisce i commenti di un post.
 * 
 * Query params:
 * - postId: ID del post (richiesto)
 * - limit: numero di commenti per pagina (default: 20)
 * - offset: offset per paginazione (default: 0)
 * 
 * @returns { comments, total, hasMore }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // 2. Parsing parametri
    const { searchParams } = new URL(request.url);
    const postId = parseInt(searchParams.get('postId') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!postId) {
      return NextResponse.json(
        { error: 'postId è richiesto' },
        { status: 400 }
      );
    }

    // 3. Verifica che il post esista
    const post = await commentRepository.getPostInfo(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    // 4. Ottieni commenti tramite repository
    const commentsRows = await commentRepository.getForPost(
      postId,
      currentProfile.id,
      limit + 1,
      offset
    );

    // 5. Determina se ci sono più commenti
    const hasMore = commentsRows.length > limit;
    const commentsToReturn = hasMore ? commentsRows.slice(0, limit) : commentsRows;

    // 6. Trasforma in formato risposta
    const comments: Comment[] = commentsToReturn.map((c) => ({
      id: c.id,
      post_id: c.post_id,
      profile_id: c.profile_id,
      parent_id: c.parent_id,
      text: c.text,
      likes_count: c.likes_count,
      created_at: c.created_at,
      profile_username: c.profile_username,
      profile_full_name: c.profile_full_name,
      profile_image_url: c.profile_image_url,
      profile_is_verified: c.profile_is_verified,
      profile_has_active_story: c.profile_has_active_story,
      profile_has_viewed_story: c.profile_has_viewed_story,
      profile_is_private: c.profile_is_private,
      is_liked_by_current_user: c.is_liked,
    }));

    // 7. Costruisci risposta
    const response: GetCommentsResponse = {
      comments,
      total: post.comments_count,
      hasMore,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Comments GET] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feed/comments
 * 
 * Crea un nuovo commento su un post.
 * 
 * @body { postId, text, parentId? }
 * @returns { success, comment }
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
    const body: CreateCommentRequest = await request.json();
    const { postId, text, parentId } = body;

    if (!postId || !text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'postId e text sono richiesti' },
        { status: 400 }
      );
    }

    // 3. Verifica che il post esista e i commenti siano abilitati
    const post = await commentRepository.getPostInfo(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    if (post.comments_disabled) {
      return NextResponse.json(
        { error: 'I commenti sono disabilitati per questo post' },
        { status: 403 }
      );
    }

    // 4. Se parentId è fornito, verifica che il commento padre esista
    if (parentId) {
      const parentExists = await commentRepository.parentExists(parentId, postId);
      if (!parentExists) {
        return NextResponse.json(
          { error: 'Commento padre non trovato' },
          { status: 404 }
        );
      }
    }

    // 5. Crea il commento tramite repository
    const commentData = await commentRepository.create(
      postId,
      currentProfile.id,
      text.trim(),
      parentId
    );

    // TODO: gestire lato BE — dispatch notifica comment
    // if (post.profile_id !== currentProfile.id) {
    //   dispatchNotificationToSpring(request, {
    //     recipientProfileId: post.profile_id,
    //     senderProfileId: currentProfile.id,
    //     type: 'comment',
    //     referenceType: 'comment',
    //     referenceId: commentData.id,
    //   });
    // }

    // 7. Trasforma in formato risposta
    const comment: Comment = {
      id: commentData.id,
      post_id: commentData.post_id,
      profile_id: commentData.profile_id,
      parent_id: commentData.parent_id,
      text: commentData.text,
      likes_count: commentData.likes_count,
      created_at: commentData.created_at,
      profile_username: commentData.profile_username,
      profile_full_name: commentData.profile_full_name,
      profile_image_url: commentData.profile_image_url,
      profile_is_verified: commentData.profile_is_verified,
      profile_is_private: commentData.profile_is_private,
      is_liked_by_current_user: false,
      profile_has_active_story: false,
      profile_has_viewed_story: false,
    };

    // 8. Costruisci risposta
    const response: CreateCommentResponse = {
      success: true,
      comment,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[Comments POST] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
