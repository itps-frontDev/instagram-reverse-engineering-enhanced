/**
 * @fileoverview API per verificare se l'utente può visualizzare i contenuti del profilo
 *
 * Questo endpoint controlla se l'utente corrente ha il permesso di vedere
 * i post e i contenuti di un profilo.
 *
 * LOGICA DI VISIBILITÀ:
 * - Profilo pubblico: visibile a tutti (anche utenti non autenticati)
 * - Profilo privato + proprietario: visibile
 * - Profilo privato + follower accepted: visibile
 * - Profilo privato + non follower: NON visibile
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/[username]/can-view
 */

import { NextRequest, NextResponse } from 'next/server';
import { profileRepository } from '@/repositories';
import { CanViewResponse } from '@/types/profile';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';

// ============================================================================
// GET /api/profiles/[username]/can-view
// ============================================================================

/**
 * Verifica se l'utente corrente può visualizzare i contenuti del profilo.
 *
 *
 * @param request - Oggetto request Next.js
 * @param params - Parametri route contenenti username
 * @returns Stato di visibilità con motivo opzionale
 *
 * @example
 * // Verifica se può visualizzare il profilo
 * const response = await fetch('/api/profiles/johndoe/can-view');
 * const { canView, reason } = await response.json();
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
        { error: 'Username non valido' },
        { status: 400 }
      );
    }

    // Cerca il profilo target usando il repository
    const targetProfile = await profileRepository.findByUsername(username);

    if (!targetProfile) {
      const response: CanViewResponse = {
        canView: false,
        reason: 'not_found',
      };

      return NextResponse.json(response, { status: 404 });
    }

    // Profilo pubblico: tutti possono vedere
    if (!targetProfile.is_private) {
      const response: CanViewResponse = {
        canView: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          // Cache pubblica: può essere cachata dai CDN
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Profilo privato: verifica autenticazione e relazione di follow
    const currentProfile = await getCurrentProfile();

    // Non autenticato: non può vedere profili privati (NON dovrebbe mai accadere qui)
    if (!currentProfile) {
      const response: CanViewResponse = {
        canView: false,
        reason: 'private',
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // Proprietario del profilo: può sempre vedere
    if (currentProfile.id === targetProfile.id) {
      const response: CanViewResponse = {
        canView: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // -------------------------------------------------------------------------
    // Verifica relazione di follow: solo follower accepted possono vedere
    // -------------------------------------------------------------------------
    const follow = await profileRepository.getFollowRelationship(
      currentProfile.id,
      targetProfile.id
    );

    // Può vedere solo se è follower con stato 'accepted'
    const canView = follow?.status === 'accepted';

    const response: CanViewResponse = {
      canView,
      reason: canView ? undefined : 'private',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Errore nel controllo permessi di visualizzazione:', error);

    return NextResponse.json(
      {
        error: 'Errore interno del server',
        message: error instanceof Error ? error.message : 'Errore sconosciuto',
      },
      { status: 500 }
    );
  }
}
