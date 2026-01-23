/**
 * @fileoverview API della pagina Explore
 *
 * GET /api/explore
 * Restituisce post popolari da profili pubblici per la pagina esplora.
 * 
 * ALGORITMO:
 * - Solo profili pubblici (is_private = 0)
 * - Esclude i propri post
 * - Ordina in modo casuale (RANDOM()) per varietà
 * - Mescola immagini e video
 * 
 * OTTIMIZZAZIONI:
 * - Query con DISTINCT per evitare duplicati
 * - Media caricati in batch separato
 * - Paginazione con limit+1 per determinare hasMore
 * 
 * @module api/explore
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { postRepository } from '@/repositories';
import type { FeedPost, GetFeedResponse } from '@/types/feed';

export const runtime = 'nodejs';

/**
 * GET /api/explore
 * 
 * Restituisce post per la pagina Explore.
 * 
 * Query params:
 * - limit: numero di post per pagina (default: 30)
 * - offset: offset per paginazione (default: 0)
 * 
 * @returns { posts, nextCursor, hasMore }
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
    const limit = parseInt(searchParams.get('limit') || '30');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Ottieni post tramite repository (limit+1 per hasMore)
    const posts = await postRepository.getExplore(currentProfile.id, limit + 1, offset);

    // 4. Determina se ci sono più post
    const hasMore = posts.length > limit;
    const postsToReturn = hasMore ? posts.slice(0, limit) : posts;

    // 5. Ottieni media per tutti i post tramite repository
    const postIds = postsToReturn.map((p) => p.id);
    const mediaByPost = await postRepository.getMediaForPosts(postIds);

    // 6. Trasforma in formato FeedPost
    const feedPosts: FeedPost[] = postsToReturn.map((post) => ({
      id: post.id,
      profile_id: post.profile_id,
      caption: post.caption,
      location: post.location,
      is_comments_disabled: post.is_comments_disabled,
      is_likes_hidden: post.is_likes_hidden,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      profile_username: post.profile_username,
      profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url,
      profile_is_verified: post.profile_is_verified,
      profile_is_private: post.profile_is_private,
      profile_has_active_story: post.profile_has_active_story,
      profile_has_viewed_story: false, // Explore posts don't track viewed stories
      is_following_author: post.is_following_author,
      media: mediaByPost.get(post.id) || [],
      is_liked_by_current_user: post.is_liked,
      is_saved_by_current_user: post.is_saved,
    }));

    // 7. Costruisci risposta
    const response: GetFeedResponse = {
      posts: feedPosts,
      nextCursor: hasMore ? (offset + limit).toString() : null,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Explore API] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
