/**
 * @fileoverview API per le Impostazioni Privacy
 *
 * PUT /api/profiles/privacy - Cambia profilo pubblico/privato.
 * 
 * LOGICA BUSINESS:
 * - Quando si passa da privato a pubblico, tutte le richieste
 *   di follow pending vengono automaticamente accettate.
 * - I contatori follower vengono aggiornati di conseguenza.
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/privacy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// PUT /api/profiles/privacy
// ============================================================================

/**
 * Aggiorna le impostazioni privacy del profilo.
 * 
 * COMPORTAMENTO:
 * - Da privato a pubblico: accetta tutte le richieste pending
 * - Da pubblico a privato: nessuna azione aggiuntiva
 * 
 * @param request - Richiesta Next.js con { is_private: boolean }
 * @returns Stato aggiornato della privacy
 */
export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    // Parsing del body
    const body = await request.json();
    const { is_private } = body;

    // Validazione: deve essere un booleano
    if (typeof is_private !== 'boolean') {
      return NextResponse.json(
        { error: 'is_private deve essere un valore booleano' },
        { status: 400 }
      );
    }

    // Stato attuale del profilo
    const wasPrivate = currentProfile.is_private;
    const willBePublic = !is_private;

    // Aggiorna l'impostazione privacy usando il repository
    await profileRepository.update(currentProfile.id, { is_private });

    // Se passa da privato a pubblico, accetta tutte le richieste pending
    if (wasPrivate && willBePublic) {
      // Ottiene le richieste pending usando il repository
      const pendingRequests = await profileRepository.getPendingFollowRequests(
        currentProfile.id
      );
      const pendingFollowers = pendingRequests.length;

      // Accetta tutte le richieste pending in batch usando il repository
      if (pendingFollowers > 0) {
        await profileRepository.acceptAllPendingFollowRequests(currentProfile.id);

        // Aggiorna il contatore follower
        await profileRepository.incrementFollowersCount(
          currentProfile.id, 
          pendingFollowers
        );
      }
    }

    return NextResponse.json({
      success: true,
      is_private: is_private,
      message: is_private 
        ? 'Account impostato come privato' 
        : 'Account impostato come pubblico, tutte le richieste accettate'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/privacy] Errore:', error);
    return NextResponse.json(
      { error: 'Impossibile aggiornare le impostazioni privacy' },
      { status: 500 }
    );
  }
}
