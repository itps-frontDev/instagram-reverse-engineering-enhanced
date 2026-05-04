/**
 * @fileoverview API per ottenere lo stato della relazione di follow
 *
 * Questo endpoint restituisce la relazione di follow tra l'utente corrente
 * e il profilo target. Usato per mostrare lo stato corretto dei pulsanti
 * "Segui" / "Richiesta inviata" / "Segui già" nell'UI.
 *
 * STATI POSSIBILI:
 * - isOwnProfile=true: è il proprio profilo (nessun pulsante follow)
 * - isFollowing=true: sta seguendo (mostra "Segui già")
 * - isPending=true: richiesta in attesa (mostra "Richiesta inviata")
 * - isFollowedBy=true: l'altro ti segue (mostra "Ti segue")
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/[username]/follow-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository } from '@/repositories';
import { GetFollowStatusResponse } from '@/types/profile';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';

// ============================================================================
// GET /api/profiles/[username]/follow-status
// ============================================================================

/**
 * Ottiene lo stato di follow tra l'utente corrente e il profilo target.
 *
 * Richiede autenticazione tramite cookie HTTP-only.
 *
 * LOGICA:
 * 1. Ottiene il profilo corrente dall'auth
 * 2. Cerca il profilo target per username
 * 3. Se è il proprio profilo, restituisce isOwnProfile=true
 * 4. Altrimenti, controlla le relazioni di follow in entrambe le direzioni
 *
 * @param request - Oggetto request Next.js
 * @param params - Parametri route contenenti username
 * @returns Informazioni sullo stato di follow
 *
 * @example
 * // Fetch follow status
 * const response = await fetch('/api/profiles/johndoe/follow-status');
 * const { isFollowing, isPending, isOwnProfile, isFollowedBy } = await response.json();
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Validazione parametro username
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Ottiene il profilo corrente
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Cerca il profilo target usando il repository
    const targetProfile = await profileRepository.findByUsername(username);

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profilo non trovato' },
        { status: 404 }
      );
    }

    // Controlla se è il proprio profilo
    const isOwnProfile = currentProfile.id === targetProfile.id;

    if (isOwnProfile) {
      const response: GetFollowStatusResponse = {
        isFollowing: false,
        isFollowedBy: false,
        isPending: false,
        isOwnProfile: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          // No cache: lo stato può cambiare rapidamente
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // -------------------------------------------------------------------------
    // Ottiene le relazioni di follow in entrambe le direzioni
    // -------------------------------------------------------------------------
    
    // Relazione: current -> target (l'utente corrente segue il target?)
    const followRelation = await profileRepository.getFollowRelationship(
      currentProfile.id,
      targetProfile.id
    );

    // Relazione: target -> current (il target segue l'utente corrente?)
    const followedByRelation = await profileRepository.getFollowRelationship(
      targetProfile.id,
      currentProfile.id
    );

    // -------------------------------------------------------------------------
    // Costruisce la risposta basata sullo stato delle relazioni
    // -------------------------------------------------------------------------
    const response: GetFollowStatusResponse = {
      // isFollowing: true solo se la relazione esiste ed è 'accepted'
      isFollowing: followRelation?.status === 'accepted',
      // isFollowedBy: true solo se la relazione inversa è 'accepted'
      isFollowedBy: followedByRelation?.status === 'accepted',
      // isPending: true se la richiesta è in attesa di approvazione
      isPending: followRelation?.status === 'pending',
      isOwnProfile: false,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Errore nel recupero dello stato di follow:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
