/**
 * @fileoverview Verifica se l'utente ha messo like al post
 * GET /api/posts/[postId]/is-liked
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfileId } from '@/lib/auth';
import { postRepository } from '@/repositories';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    // Verifica autenticazione
    const profileId = await getCurrentProfileId();
    if (!profileId) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    const { postId } = await params;

    // Verifica tramite repository se l'utente ha messo like
    const isLiked = await postRepository.hasLiked(parseInt(postId), profileId);

    return NextResponse.json({ isLiked });
  } catch (error) {
    console.error('Errore verifica stato like:', error);
    return NextResponse.json({ isLiked: false });
  }
}
