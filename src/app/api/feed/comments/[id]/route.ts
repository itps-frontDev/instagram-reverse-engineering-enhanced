/**
 * @fileoverview API per operazioni su singolo commento
 *
 * DELETE /api/feed/comments/[id]
 * Elimina un commento (solo proprietario commento o post).
 * 
 * AUTORIZZAZIONE:
 * - Proprietario del commento può eliminarlo
 * - Proprietario del post può eliminare qualsiasi commento sul suo post
 * 
 * @module api/feed/comments/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { commentRepository } from '@/repositories';

/**
 * DELETE /api/feed/comments/[id]
 * 
 * Elimina un commento (soft delete).
 * Decrementa comments_count del post se è un commento top-level.
 * 
 * @param params.id - ID del commento da eliminare
 * @returns { success: true } o errore
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    
    const commentId = parseInt(id);
    if (!commentId || isNaN(commentId)) {
      return NextResponse.json({ error: 'ID commento non valido' }, { status: 400 });
    }
    
    // Elimina tramite repository con verifica ownership
    const result = await commentRepository.deleteWithAuth(commentId, currentProfile.id);
    
    if (!result.success) {
      const statusCode = result.error === 'Commento non trovato' ? 404 : 
                         result.error === 'Non autorizzato' ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status: statusCode });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Delete Comment] Errore:', error);
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 });
  }
}
