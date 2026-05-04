/**
 * @fileoverview API per gestione singolo post
 *
 * Endpoint disponibili:
 * - GET    /api/posts/[postId] - Recupera un post con tutti i media
 * - DELETE /api/posts/[postId] - Elimina un post (soft delete)
 * - PATCH  /api/posts/[postId] - Modifica caption del post
 * 
 * CONCETTI IMPORTANTI:
 * 
 * 1. SOFT DELETE:
 *    Non eliminiamo mai fisicamente i record. Impostiamo deleted_at
 *    alla data corrente. Questo permette:
 *    - Ripristino dei dati in caso di errore
 *    - Audit trail completo
 *    - Integrità referenziale preservata
 * 
 * 2. AUTORIZZAZIONE:
 *    Le operazioni di modifica (DELETE, PATCH) verificano che l'utente
 *    corrente sia il proprietario del post tramite postRepository.isOwner()
 * 
 * 3. MEDIA CASCADE:
 *    Quando un post viene eliminato, anche i suoi media vengono
 *    soft-deleted tramite postRepository.softDeleteMedia()
 * 
 * @module api/posts/[postId]
 */

import { NextRequest, NextResponse } from 'next/server';
import type { FeedPost } from '@/types/feed';
import { getCurrentProfileId } from '@/lib/auth';
import { config } from '@/lib/config';
import { postRepository } from '@/repositories';

// Forza runtime Node.js per accesso al database
export const runtime = 'nodejs';

// ============================================================================
// GET /api/posts/[postId]
// ============================================================================

/**
 * Recupera un singolo post con tutti i suoi media.
 * 
 * Il repository incapsula:
 * - Query JOIN con profiles
 * - Subquery per is_liked e is_saved
 * - Conversione booleani SQLite
 * 
 * @param request - Request Next.js
 * @param params - Contiene postId come stringa
 * @returns FeedPost o errore
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {

    // Verifica autenticazione
    // Ottieni ID profilo corrente (per calcolo is_liked, is_saved)
    const currentProfileId = await getCurrentProfileId();
    if (!currentProfileId) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    // Estrai e valida postId
    const { postId } = await params;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum)) {
      return NextResponse.json(
        { error: 'ID post non valido' }, 
        { status: 400 }
      );
    }

    /**
     * REFACTORING: Usa il repository.
     * findByIdForView() incapsula tutta la logica di query.
     */
    const post = await postRepository.findByIdForView(postIdNum, currentProfileId);

    // Post non trovato o eliminato
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' }, 
        { status: 404 }
      );
    }

    // Recupera i media del post usando il repository
    const media = await postRepository.getMedia(postIdNum);

    // Converti in formato API usando helper repository
    const feedPost = postRepository.convertPostForViewToAPI(post, media);

    return NextResponse.json({ post: feedPost });
  } catch (error) {
    console.error('[Posts] Errore recupero post:', error);
    return NextResponse.json(
      { error: 'Impossibile recuperare il post' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/posts/[postId]
// ============================================================================

/**
 * Elimina un post (soft delete).
 * 
 * @param request - Request Next.js
 * @param params - Contiene postId
 * @returns { success: true } o errore
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {

    // Verifica autenticazione
    const currentProfileId = await getCurrentProfileId();
    if (!currentProfileId) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    const { postId } = await params;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum)) {
      return NextResponse.json(
        { error: 'ID post non valido' }, 
        { status: 400 }
      );
    }
    

    /**
     * REFACTORING: Usa isOwner() del repository.
     * Incapsula verifica esistenza + proprietà.
     */
    const isOwner = await postRepository.isOwner(postIdNum, currentProfileId);
    
    if (!isOwner) {
      // Potrebbe essere: post non esiste O non sei proprietario
      // Per sicurezza non distinguiamo i due casi (information disclosure)
      return NextResponse.json(
        { error: 'Post non trovato o accesso negato' }, 
        { status: 404 }
      );
    }

    /**
     * Il repository gestisce i timestamp e le query.
     */
    await postRepository.softDelete(postIdNum);
    await postRepository.softDeleteMedia(postIdNum);

    return NextResponse.json({ 
      success: true, 
      message: 'Post eliminato con successo' 
    });
  } catch (error) {
    console.error('[Posts] Errore eliminazione post:', error);
    return NextResponse.json(
      { error: 'Impossibile eliminare il post' },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/posts/[postId]
// ============================================================================

/**
 * Modifica la caption di un post.
 * 
 * @param request - Request con body JSON { caption: string }
 * @param params - Contiene postId
 * @returns { success: true, caption } o errore
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {

    // Verifica autenticazione
    const currentProfileId = await getCurrentProfileId();
    if (!currentProfileId) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    const { postId } = await params;
    const postIdNum = parseInt(postId);

    if (isNaN(postIdNum)) {
      return NextResponse.json(
        { error: 'ID post non valido' }, 
        { status: 400 }
      );
    }

    

    // Verifica proprietà usando il repository
    const isOwner = await postRepository.isOwner(postIdNum, currentProfileId);
    
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Post non trovato o accesso negato' }, 
        { status: 404 }
      );
    }

    // Parse body JSON
    const body = await request.json();
    const { caption } = body;

    // Validazione caption
    if (caption === undefined) {
      return NextResponse.json(
        { error: 'Caption richiesta' }, 
        { status: 400 }
      );
    }

    // Limite caratteri (usa config)
    const maxCaptionLength = config.post?.maxCaptionLength || 2200;
    if (caption.length > maxCaptionLength) {
      return NextResponse.json(
        { error: `Caption troppo lunga (max ${maxCaptionLength} caratteri)` }, 
        { status: 400 }
      );
    }

    // Il metodo costruisce dinamicamente la query.
    await postRepository.update(postIdNum, { caption });

    return NextResponse.json({ 
      success: true, 
      message: 'Post aggiornato con successo', 
      caption 
    });
  } catch (error) {
    console.error('[Posts] Errore aggiornamento post:', error);
    return NextResponse.json(
      { error: 'Impossibile aggiornare il post' },
      { status: 500 }
    );
  }
}
