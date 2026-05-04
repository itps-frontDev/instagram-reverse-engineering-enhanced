/**
 * @fileoverview API dei Reels
 *
 * GET /api/reels
 * Restituisce i post video (reels) per il feed reels.
 * Implementa scroll infinito con ordinamento casuale.
 * 
 * ALGORITMO:
 * - Solo post con media di tipo 'video'
 * - Visibili: pubblici, propri, o da profili seguiti
 * - Ordine casuale per varietà
 * 
 * @module api/reels
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { postRepository } from '@/repositories/PostRepository';
import type { Reel, GetReelsResponse } from '@/types/feed';

export const runtime = 'nodejs';

/**
 * GET /api/reels
 * 
 * Restituisce i reels (post video).
 * 
 * Query params:
 * - limit: numero di reels per pagina (default: 10)
 * - offset: offset per paginazione (default: 0)
 * 
 * @returns { reels, hasMore, total }
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Ottieni reels tramite repository
    const reels = await postRepository.getReels(currentProfile.id, limit, offset);

    // 4. Ottieni conteggio totale
    const total = await postRepository.countReels(currentProfile.id);

    // 5. Ottieni media per tutti i reels
    const reelIds = reels.map(r => r.id);
    const mediaMap = await postRepository.getMediaForPosts(reelIds);

    // 6. Trasforma in formato risposta usando helper repository
    const formattedReels = reels.map(reel => 
      postRepository.convertReelForAPI(reel, mediaMap.get(reel.id) || [])
    );

    // 7. Costruisci risposta
    const response: GetReelsResponse = {
      reels: formattedReels,
      hasMore: offset + reels.length < total,
      total,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Reels API] Errore:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei reels' },
      { status: 500 }
    );
  }
}
