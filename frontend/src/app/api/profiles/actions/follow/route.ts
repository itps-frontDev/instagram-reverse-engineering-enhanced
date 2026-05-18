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
import { profileRepository } from '@/repositories';
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
  console.log('[FOLLOW API] Request received');
  try {
    // Ottiene il profilo corrente autenticato
    const currentProfile = await getCurrentProfile();
    console.log('[FOLLOW API] Current profile:', currentProfile?.id);

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Parsing del body della richiesta
    const body: FollowRequest = await request.json();
    console.log('[FOLLOW API] Request body:', body);
    const targetProfileId = Number((body as { targetProfileId?: number | string }).targetProfileId);
    console.log('[FOLLOW API] Target profile ID:', targetProfileId);

    // Validazione
    if (!Number.isInteger(targetProfileId) || targetProfileId <= 0) {
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
    console.log('[DEBUG] Creating follow:', {
      followerProfileId: currentProfile.id,
      followingProfileId: targetProfileId,
      status: followStatus,
      targetIsPrivate: targetProfile.is_private,
    });

    const followId = await profileRepository.createFollow(
      currentProfile.id,
      targetProfileId,
      followStatus
    );

    console.log('[DEBUG] Follow created with ID:', followId);

    // Aggiorna i contatori solo se il follow è accettato immediatamente
    // Se è pending, i contatori verranno aggiornati quando la richiesta sarà accettata
    if (followStatus === 'accepted') {
      await profileRepository.incrementFollowingCount(currentProfile.id);
      await profileRepository.incrementFollowersCount(targetProfileId);
    }

    // TODO: gestire lato BE — delete notifiche follow/follow_request duplicate + dispatch nuova notifica
    // const notificationType = followStatus === 'pending' ? 'follow_request' : 'follow';
    // deleteNotificationsByFilterInSpring(request, {
    //   recipientProfileId: targetProfileId,
    //   senderProfileId: currentProfile.id,
    //   types: ['follow', 'follow_request'],
    // });
    // dispatchNotificationToSpring(request, {
    //   recipientProfileId: targetProfileId,
    //   senderProfileId: currentProfile.id,
    //   type: notificationType,
    //   referenceType: 'profile',
    //   referenceId: currentProfile.id,
    // });

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
