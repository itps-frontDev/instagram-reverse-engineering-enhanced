/**
 * @fileoverview API per rifiutare/eliminare una richiesta di follow
 *
 * POST /api/profiles/follow/reject - Rifiuta una richiesta di follow
 *
 * FLUSSO:
 * 1. Verifica autenticazione
 * 2. Trova la richiesta di follow
 * 3. Elimina la richiesta (soft delete)
 * 4. Decrementa following_count di chi ha fatto la richiesta
 * 5. Se era già accepted, decrementa anche followers_count
 * 6. Elimina le notifiche correlate
 *
 * REFACTORING: Usa ProfileRepository e NotificationRepository.
 * 
 * @module api/profiles/follow/reject
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository, notificationRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

/**
 * POST /api/profiles/follow/reject
 * Rifiuta/elimina una richiesta di follow.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function POST(request: NextRequest) {
  try {
    // Autenticazione: ottiene il profilo corrente dal token JWT
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Parsing e validazione del body
    const body = await request.json();
    const { followerId } = body;

    if (!followerId || typeof followerId !== 'number') {
      return NextResponse.json(
        { error: 'Follower ID è richiesto' },
        { status: 400 }
      );
    }

    // Verifica esistenza richiesta di follow usando il repository
    const existingFollow = await profileRepository.getFollowRelationship(
      followerId,
      currentProfile.id
    );

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      );
    }

    // Elimina la richiesta (soft delete)
    await profileRepository.deleteFollowById(existingFollow.id);

    // Decrementa i contatori solo se il follow era già accepted
    // (se era pending, i contatori non erano mai stati incrementati)
    if (existingFollow.status === 'accepted') {
      await profileRepository.decrementFollowingCount(followerId);
      await profileRepository.decrementFollowersCount(currentProfile.id);
    }

    // Elimina le notifiche correlate (follow_request e follow)
    await notificationRepository.deleteFollowRequestNotifications(
      followerId,
      currentProfile.id
    );

    return NextResponse.json({
      success: true,
      message: 'Follow request rejected'
    });
  } catch (error) {
    console.error('Errore nel rifiuto della richiesta di follow:', error);
    return NextResponse.json(
      { error: 'Errore durante il rifiuto della richiesta di follow' },
      { status: 500 }
    );
  }
}
