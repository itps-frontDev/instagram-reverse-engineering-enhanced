/**
 * @fileoverview API per rimuovere un follower
 *
 * POST /api/profiles/actions/remove-follower
 * - Rimuove un utente dalla propria lista di follower
 *
 * FLUSSO:
 * 1. Verifica autenticazione
 * 2. Trova la relazione di follow dove il target ti segue
 * 3. Elimina la relazione (soft delete)
 * 4. Aggiorna i contatori (followers e following)
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/actions/remove-follower
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

interface RemoveFollowerRequest {
  targetProfileId: number;
}

/**
 * POST /api/profiles/actions/remove-follower
 * Rimuove un utente dalla propria lista di follower.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
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

    // Parsing e validazione del body
    const body: RemoveFollowerRequest = await request.json();
    const { targetProfileId } = body;

    if (!targetProfileId || typeof targetProfileId !== 'number') {
      return NextResponse.json(
        { error: 'ID del profilo target è richiesto' },
        { status: 400 }
      );
    }

    // -------------------------------------------------------------------------
    // Verifica che il target ti stia effettivamente seguendo
    // La relazione è: target -> current (il target segue te)
    // -------------------------------------------------------------------------
    const followRelation = await profileRepository.getFollowRelationship(
      targetProfileId,
      currentProfile.id
    );

    if (!followRelation) {
      return NextResponse.json(
        { error: `L'utente non ti sta seguendo` },
        { status: 409 }
      );
    }

    const wasAccepted = followRelation.status === 'accepted';

    // Elimina la relazione di follow (soft delete)
    await profileRepository.deleteFollowById(followRelation.id);

    // Aggiorna i contatori solo se la relazione era 'accepted'
    if (wasAccepted) {
      // Decrementa followers_count per l'utente corrente
      await profileRepository.decrementFollowersCount(currentProfile.id);
      
      // Decrementa following_count per il target
      await profileRepository.decrementFollowingCount(targetProfileId);
    }

    return NextResponse.json({
      success: true,
      message: 'Follower rimosso con successo',
    });
  } catch (error) {
    console.error('Errore nella rimozione del follower:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
