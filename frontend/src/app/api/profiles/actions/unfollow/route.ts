/**
 * @fileoverview API per Smettere di Seguire un Utente
 *
 * POST /api/profiles/actions/unfollow
 * Rimuove una relazione di follow (soft delete).
 * 
 * LOGICA UNFOLLOW:
 * - Soft delete della relazione (imposta deleted_at)
 * - Decrementa i contatori appropriati
 * - Rimuove la notifica di follow associata
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/actions/unfollow
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository, notificationRepository } from '@/repositories';
import { UnfollowRequest, UnfollowResponse } from '@/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// POST /api/profiles/actions/unfollow
// ============================================================================

/**
 * Smette di seguire un utente.
 *
 * Richiede autenticazione.
 *
 * @param request - Richiesta con body { targetProfileId: number }
 * @returns Risposta di conferma unfollow
 */
export async function POST(request: NextRequest) {
  try {
    // Ottiene il profilo corrente autenticato
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Parsing del body della richiesta
    const body: UnfollowRequest = await request.json();
    const { targetProfileId } = body;

    // Validazione
    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'ID profilo target obbligatorio' },
        { status: 400 }
      );
    }

    // Non puoi smettere di seguire te stesso
    if (currentProfile.id === targetProfileId) {
      return NextResponse.json(
        { error: 'Non puoi smettere di seguire te stesso' },
        { status: 400 }
      );
    }

    // Verifica esistenza profilo target usando repository
    const targetProfile = await profileRepository.findById(targetProfileId);

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profilo target non trovato' },
        { status: 404 }
      );
    }

    // Verifica se sta effettivamente seguendo usando repository
    const existingRelation = await profileRepository.getFollowRelationship(
      currentProfile.id,
      targetProfileId
    );

    if (!existingRelation) {
      return NextResponse.json(
        { error: 'Non stai seguendo questo utente' },
        { status: 409 }
      );
    }

    const wasAccepted = existingRelation.status === 'accepted';

    // Soft delete della relazione di follow usando il repository
    await profileRepository.deleteFollow(currentProfile.id, targetProfileId);

    /**
     * Aggiorna i contatori solo se la relazione era 'accepted'
     * (se era pending, i contatori non erano mai stati incrementati)
     */
    if (wasAccepted) {
      await profileRepository.decrementFollowingCount(currentProfile.id);
      await profileRepository.decrementFollowersCount(targetProfileId);
    }

    // Rimuove la notifica di follow usando il repository
    await notificationRepository.deleteFollowNotification(
      currentProfile.id,  // attore
      targetProfileId     // destinatario
    );

    // Risposta di successo
    const response: UnfollowResponse = {
      success: true,
      message: wasAccepted
        ? `Hai smesso di seguire ${targetProfile.username}`
        : `Richiesta di follow annullata per ${targetProfile.username}`,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error(`[API] Errore nell\'unfollow:`, error);

    return NextResponse.json(
      {
        error: 'Errore interno del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
