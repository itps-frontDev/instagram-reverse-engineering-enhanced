/**
 * @fileoverview API per salvare/rimuovere post dai preferiti
 *
 * POST /api/feed/save
 * Toggle del salvataggio di un post (salva se non salvato, rimuove se già salvato)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { postRepository } from '@/repositories';
import type { SavePostRequest, SavePostResponse } from '@/types/feed';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Parsing body
    const body: SavePostRequest = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'Il post non esiste' },
        { status: 400 }
      );
    }

    // Verifica esistenza del post tramite repository
    const post = await postRepository.findById(postId);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trovato' },
        { status: 404 }
      );
    }

    // Verifica se è già salvato
    const alreadySaved = await postRepository.isSaved(postId, currentProfile.id);

    let saved: boolean;

    if (alreadySaved) {
      // Rimuove il salvataggio (soft delete)
      await postRepository.unsave(postId, currentProfile.id);
      saved = false;
    } else {
      // Salva il post (o ri-attiva se era stato rimosso)
      await postRepository.save(postId, currentProfile.id);
      saved = true;
    }

    const response: SavePostResponse = {
      success: true,
      saved,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Save] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
