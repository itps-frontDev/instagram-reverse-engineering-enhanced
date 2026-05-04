/**
 * @fileoverview API per i Following di un Profilo
 *
 * GET /api/profiles/[username]/following
 * Restituisce la lista di utenti che il profilo segue.
 * 
 * LOGICA PRIVACY:
 * - Profilo pubblico: tutti possono vedere i following
 * - Profilo privato: solo il proprietario o chi segue può vedere
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/[username]/following
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// GET /api/profiles/[username]/following
// ============================================================================

/**
 * Ottiene la lista dei profili seguiti da un utente.
 * 
 * @param request - Richiesta Next.js
 * @param params - Parametri dinamici (username)
 * @returns Lista following con stato relazione
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {

    // Autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Trova il profilo target usando il repository
    const targetProfile = await profileRepository.findByUsername(username);

    if (!targetProfile) {
      return NextResponse.json(
        { error: 'Profilo non trovato' }, 
        { status: 404 }
      );
    }

    // Ottiene il profilo corrente (può essere null per guest)
    const currentProfile = await getCurrentProfile();

    // Verifica permessi per profili privati
    if (targetProfile.is_private) {
      // Proprietario può sempre vedere
      if (currentProfile?.id !== targetProfile.id) {
        // Verifica se l'utente corrente segue il profilo privato
        const isFollowing = currentProfile 
          ? await profileRepository.isFollowing(currentProfile.id, targetProfile.id)
          : false;

        if (!isFollowing) {
          return NextResponse.json(
            { error: 'Non puoi vedere i following di un profilo privato' }, 
            { status: 403 }
          );
        }
      }
    }

    // Ottiene i following con stato relazione usando il repository
    const following = await profileRepository.getFollowingWithStatus(
      targetProfile.id,
      currentProfile?.id ?? null,
      50, // limite
      0   // offset (TODO: aggiungere paginazione)
    );

    return NextResponse.json({ following });
  } catch (error) {
    console.error('Errore nel recupero dei following:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
