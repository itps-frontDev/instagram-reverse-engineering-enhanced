/**
 * @fileoverview API per Seguire un Utente
 *
 * POST /api/profiles/actions/follow
 * Crea una relazione di follow tra l'utente corrente e un profilo target.
 * Se il target è privato, crea una richiesta pending.
 * 
 * LOGICA FOLLOW:
 * - Profilo pubblico: status = 'accepted' immediato
 * - Profilo privato: status = 'pending' (richiede approvazione)
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/actions/follow
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository, notificationRepository } from '@/repositories';
import { FollowRequest, FollowResponse } from '@/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// POST /api/profiles/actions/follow
// ============================================================================

/**
 * Segue un utente.
 *
 * Richiede autenticazione.
 *
 * @param request - Richiesta con body { targetProfileId: number }
 * @returns Risposta con stato (pending o accepted)
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
    const body: FollowRequest = await request.json();
    const { targetProfileId } = body;

    // Validazione
    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'ID profilo target obbligatorio' },
        { status: 400 }
      );
    }

    // Non puoi seguire te stesso
    if (currentProfile.id === targetProfileId) {
      return NextResponse.json(
        { error: 'Non puoi seguire te stesso' },
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

    // Verifica se già segue usando repository
    const existingRelation = await profileRepository.getFollowRelationship(
      currentProfile.id,
      targetProfileId
    );

    if (existingRelation) {
      const message =
        existingRelation.status === 'accepted'
          ? 'Stai già seguendo questo utente'
          : 'Richiesta di follow già inviata';

      return NextResponse.json(
        { error: message },
        { status: 409 }
      );
    }

    // Determina lo status in base alla privacy del target
    const followStatus = targetProfile.is_private ? 'pending' : 'accepted';

    // Crea la relazione di follow usando il repository
    await profileRepository.createFollow(
      currentProfile.id,
      targetProfileId,
      followStatus
    );

    // Aggiorna i contatori solo se il follow è accettato immediatamente
    // Se è pending, i contatori verranno aggiornati quando la richiesta sarà accettata
    if (followStatus === 'accepted') {
      await profileRepository.incrementFollowingCount(currentProfile.id);
      await profileRepository.incrementFollowersCount(targetProfileId);
    }

    // Crea notifica per il target usando il repository
    const notificationType = followStatus === 'pending' ? 'follow_request' : 'follow';
    
    // Prima elimina notifiche di follow duplicate esistenti
    await notificationRepository.deleteFollowNotification(
      currentProfile.id,  // attore
      targetProfileId     // destinatario
    );
    
    // Poi crea la nuova notifica
    await notificationRepository.create({
      recipient_profile_id: targetProfileId,
      actor_profile_id: currentProfile.id,
      type: notificationType,
    });

    // Risposta di successo
    const response: FollowResponse = {
      success: true,
      status: followStatus,
      message:
        followStatus === 'accepted'
          ? `Ora segui ${targetProfile.username}`
          : `Richiesta di follow inviata a ${targetProfile.username}`,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Errore nel follow:', error);

    return NextResponse.json(
      {
        error: 'Errore interno del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
