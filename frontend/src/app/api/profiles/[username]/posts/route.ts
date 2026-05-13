/**
 * @fileoverview API per i post di un profilo
 *
 * GET /api/profiles/[username]/posts
 * Restituisce i post di un profilo con supporto paginazione.
 * Supporta filtraggio per tab (posts, reels, saved, tagged).
 * 
 * TABS:
 * - posts: post normali del profilo
 * - reels: video (reels) del profilo
 * - saved: post salvati (solo per il proprietario)
 * - tagged: post in cui il profilo è taggato
 * 
 * @module api/profiles/[username]/posts
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository, postRepository } from '@/repositories';
import { Post, GetPostsResponse, ProfileTab } from '@/types/profile';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';
import { canViewProfileAction } from '@/features/profile';

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di post per pagina (come Instagram) */
const POSTS_PER_PAGE = 12;

// ============================================================================
// GET /api/profiles/[username]/posts
// ============================================================================

/**
 * GET /api/profiles/[username]/posts
 * 
 * Restituisce i post di un profilo.
 *
 * Query parameters:
 * - tab: 'posts' | 'reels' | 'saved' | 'tagged' (default: 'posts')
 * - page: number (default: 0)
 *
 * @returns { posts, hasMore, total }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // 1. Autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { username } = await params;
    const searchParams = request.nextUrl.searchParams;

    // 2. Parse parametri
    const tab = (searchParams.get('tab') || 'posts') as ProfileTab;
    const page = parseInt(searchParams.get('page') || '0', 10);

    // 3. Validazione parametri
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username è richiesto' },
        { status: 400 }
      );
    }

    if (!['posts', 'reels', 'saved', 'tagged'].includes(tab)) {
      return NextResponse.json(
        { error: 'Parametro tab non valido. Deve essere: posts, reels, saved, o tagged' },
        { status: 400 }
      );
    }

    if (isNaN(page) || page < 0) {
      return NextResponse.json(
        { error: 'Parametro page non valido' },
        { status: 400 }
      );
    }

    // 4. Trova profilo target tramite repository
    const targetProfile = await profileRepository.findByUsername(username);
    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profilo non trovato' },
        { status: 404 }
      );
    }

    // 5. Verifica permessi di visualizzazione tramite il gate condiviso.
    const canViewResult = await canViewProfileAction({ username });
    if (!canViewResult.success) {
      const error = canViewResult.error || 'Errore nella verifica della visibilità';
      const status =
        error === 'Authentication required.' ? 401 :
        error === 'Profile not found' ? 404 :
        error === 'Service unavailable.' ? 503 :
        500;

      return NextResponse.json({ error }, { status });
    }

    if (!canViewResult.data?.canView) {
      return NextResponse.json(
        { error: 'Non puoi visualizzare i post di un profilo privato' },
        { status: 403 }
      );
    }

    // 6. Ottieni post in base al tab
    const offset = page * POSTS_PER_PAGE;
    const limit = POSTS_PER_PAGE + 1; // +1 per verificare se ci sono più post

    let posts: Post[] = [];

    if (tab === 'tagged') {
      posts = await postRepository.getTaggedPosts(targetProfile.id, limit, offset);
    } else if (tab === 'reels') {
      posts = await postRepository.getProfileReels(targetProfile.id, limit, offset);
    } else if (tab === 'saved') {
      // Solo il proprietario può vedere i post salvati
      const currentProfile = await getCurrentProfile();
      if (!currentProfile || currentProfile.id !== targetProfile.id) {
        return NextResponse.json(
          { error: 'Non puoi visualizzare i post salvati di altri utenti' },
          { status: 403 }
        );
      }
      // Ottiene i post salvati dall'utente corrente
      posts = await postRepository.getProfileSavedPosts(currentProfile.id, limit, offset);
    } else {
      // Tab default: posts normali
      posts = await postRepository.getProfilePosts(targetProfile.id, limit, offset);
    }

    // 7. Verifica se ci sono più post
    const hasMore = posts.length > POSTS_PER_PAGE;
    if (hasMore) {
      posts = posts.slice(0, POSTS_PER_PAGE);
    }

    // 8. Costruisci risposta
    const response: GetPostsResponse = {
      posts,
      hasMore,
      total: posts.length,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        /**
         * Spiegazione Cache-Control:
         * public: può essere cachata da qualsiasi cache (CDN, proxy, browser)
         * s-maxage=30: durata cache per le cache condivise (CDN) in secondi
         * stale-while-revalidate=60: permette di servire contenuti "stale" (vecchi)
         *   per 60 secondi mentre si aggiorna la cache in background
         */
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('[Profile Posts API] Errore:', error);

    return NextResponse.json(
      {
        error: 'Errore interno del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
