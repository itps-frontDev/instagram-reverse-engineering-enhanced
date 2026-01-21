/**
 * @fileoverview API per ottenere i tag di un post
 *
 * GET /api/posts/[postId]/tags
 * Restituisce tutti gli utenti taggati in un post con le loro posizioni.
 * 
 * UTILIZZO:
 * I tag vengono mostrati quando l'utente clicca sull'icona tag
 * su un'immagine nel post viewer.
 * 
 * @module api/posts/[postId]/tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { postRepository } from '@/repositories';

/**
 * GET /api/posts/[postId]/tags
 * 
 * Ottiene tutti i tag di un post.
 * 
 * @param params.postId - ID del post
 * @returns { tags: PostTag[] }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId: postIdStr } = await params;
    const postId = parseInt(postIdStr);

    if (isNaN(postId)) {
      return NextResponse.json(
        { error: 'ID post non valido' },
        { status: 400 }
      );
    }

    // Ottieni tutti i tag tramite repository
    const tags = await postRepository.getPostTags(postId);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error('[Post Tags] Errore:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero dei tag' },
      { status: 500 }
    );
  }
}
