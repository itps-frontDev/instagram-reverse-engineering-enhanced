/**
 * @fileoverview API del Feed
 *
 * GET /api/feed
 * Restituisce i post degli utenti seguiti + esplora (profili pubblici).
 * Implementa un algoritmo di feed simile a Instagram.
 * 
 * ALGORITMO DEL FEED:
 * 1. Post dagli utenti seguiti (seguiti dall'utente corrente)
 * 2. Post dai profili pubblici (Esplora)
 * 3. Solo l'ultimo post dell'utente corrente (per non saturare il feed)
 * 4. Ordinato per data di creazione decrescente
 * 
 * OTTIMIZZAZIONI:
 * - Query con DISTINCT per evitare duplicati
 * - Subquery per is_liked, is_saved, is_following (evita JOIN complessi)
 * - Media caricati in batch separato (evita prodotto cartesiano)
 * - Paginazione con limit+1 per determinare hasMore
 * 
 * PATTERN REPOSITORY:
 * Usa PostRepository per accesso centralizzato ai dati.
 * 
 * NOTA: In produzione si userebbe un sistema di caching (Redis)
 * e un algoritmo più sofisticato basato su engagement.
 * 
 * @module api/feed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { postRepository } from '@/repositories';
import type { FeedPost, GetFeedResponse } from '@/types/feed';
import { config } from '@/lib/config';

// Forza runtime Node.js per questa API
export const runtime = 'nodejs';

/**
 * GET /api/feed
 * 
 * Restituisce il feed personalizzato per l'utente autenticato.
 * 
 * Query params:
 * - limit: numero di post per pagina (default: 20)
 * - offset: offset per paginazione (default: 0)
 * 
 * @returns { posts, nextCursor, hasMore }
 */
export async function GET(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Estrae i parametri della query string (limit, offset, ecc.) dall’URL della richiesta
    const { searchParams } = new URL(request.url);
    // Usa config per i valori di default della paginazione
    const limit = Math.min(
      parseInt(searchParams.get('limit') || String(config.pagination.defaultLimit)),
      config.pagination.maxLimit
    );
    const offset = parseInt(searchParams.get('offset') || '0');

    // Recupera i post del feed usando il repository
    // Richiede +1 per determinare se ci sono altri post
    const posts = await postRepository.getFeedWithDetails(
      currentProfile.id,
      limit + 1,
      offset
    );

    // Verifica se ci sono altri post (trucco: chiediamo 1 in più)
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // Carica i media per tutti i post in una singola query
    // Questo evita il problema N+1 (1 query per ogni post)
    const postIds = postsToReturn.map((p) => p.id);
    const mediaByPost = postIds.length > 0 
      ? await postRepository.getMediaForPosts(postIds)
      : new Map();

    // Trasforma in formato FeedPost usando la funzione helper
    const feedPosts: FeedPost[] = postsToReturn.map((post) =>
      postRepository.convertFeedPostForAPI(post, mediaByPost.get(post.id) || [])
    );

    // Prepara risposta con informazioni paginazione
    const response: GetFeedResponse = {
      posts: feedPosts,
      // nextCursor usato per paginazione cursor-based (qui usiamo offset)
      nextCursor: hasMore ? String(offset + limit) : null,
      hasMore,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Feed] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
