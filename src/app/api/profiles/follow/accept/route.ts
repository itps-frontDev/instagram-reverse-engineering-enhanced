/**
 * @fileoverview API per accettare una richiesta di follow
 *
 * POST /api/profiles/follow/accept - Accetta una richiesta di follow pending
 *
 * FLUSSO:
 * 1. Verifica autenticazione
 * 2. Trova la richiesta di follow pending
 * 3. Aggiorna lo stato a 'accepted'
 * 4. Incrementa followers_count del profilo corrente
 * 5. Aggiorna la notifica da follow_request a follow
 * 6. Crea notifica follow_accepted per il richiedente
 *
 * REFACTORING: Usa ProfileRepository e NotificationRepository.
 * 
 * @module api/profiles/follow/accept
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository, notificationRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

/**
 * POST /api/profiles/follow/accept
 * Accetta una richiesta di follow.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Accept] Inizio accettazione richiesta di follow');

    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      console.log('[Accept] Nessun profilo corrente trovato');
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    console.log('[Accept] Profilo corrente:', currentProfile.id);

    // Parsing e validazione del body
    const body = await request.json();
    const { followerId } = body;

    console.log('[Accept] Follower ID:', followerId);

    if (!followerId || typeof followerId !== 'number') {
      console.log('[Accept] ID follower non valido');
      return NextResponse.json(
        { error: 'ID follower è obbligatorio' },
        { status: 400 }
      );
    }

    // Verifica esistenza richiesta di follow usando il repository
    console.log('[Accept] Verifica esistenza richiesta di follow');
    const existingFollow = await profileRepository.getFollowRelationship(
      followerId,
      currentProfile.id
    );

    console.log('[Accept] Relazione esistente:', existingFollow);

    if (!existingFollow) {
      console.log('[Accept] Richiesta di follow non trovata');
      return NextResponse.json(
        { error: 'Richiesta di follow non trovata' },
        { status: 404 }
      );
    }

    if (existingFollow.status === 'accepted') {
      console.log('[Accept] Richiesta già accettata');
      return NextResponse.json(
        { error: 'Richiesta di follow già accettata' },
        { status: 409 }
      );
    }

    // Accetta la richiesta: aggiorna lo stato a 'accepted'
    console.log('[Accept] Aggiornamento stato follow a accepted');
    await profileRepository.acceptFollowById(existingFollow.id);
  
    console.log('[Accept] Incremento followers_count del profilo corrente');
    await profileRepository.incrementFollowersCount(currentProfile.id);
    
    console.log('[Accept] Incremento following_count del richiedente');
    await profileRepository.incrementFollowingCount(followerId);

    // -------------------------------------------------------------------------
    // Gestione notifiche
    // -------------------------------------------------------------------------
    
    // Aggiorna la notifica da follow_request a follow
    console.log('[Accept] Aggiornamento tipo notifica');
    await notificationRepository.convertFollowRequestToFollow(
      followerId,
      currentProfile.id
    );

    // Crea notifica follow_accepted per il richiedente
    console.log('[Accept] Creazione notifica follow_accepted');
    await notificationRepository.createFollowAcceptedNotification(
      followerId,
      currentProfile.id
    );

    console.log('[Accept] Successo!');
    return NextResponse.json({
      success: true,
      message: 'Follow request accepted'
    });
  } catch (error) {
    console.error('[Accept] Errore accettazione richiesta di follow:', error);
    console.error('[Accept] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
