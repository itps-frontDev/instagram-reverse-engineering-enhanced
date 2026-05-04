/**
 * @fileoverview Verifica se l'utente ha salvato il post
 * GET /api/posts/[postId]/is-saved
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

    // Verifica tramite repository se l'utente ha salvato il post
    const isSaved = await postRepository.isSaved(parseInt(postId), profileId);

    return NextResponse.json({ isSaved });
  } catch (error) {
    console.error('Errore verifica stato salvataggio:', error);
    return NextResponse.json({ isSaved: false });
  }
}
