/**
 * @fileoverview API per i Follower di un Profilo
 *
 * GET /api/profiles/[username]/followers
 * Restituisce la lista di utenti che seguono il profilo.
 * 
 * LOGICA PRIVACY:
 * - Profilo pubblico: tutti possono vedere i follower
 * - Profilo privato: solo il proprietario o chi segue può vedere
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/[username]/followers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile, getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// GET /api/profiles/[username]/followers
// ============================================================================

/**
 * Ottiene la lista dei follower di un profilo.
 * 
 * @param request - Richiesta Next.js
 * @param params - Parametri dinamici (username)
 * @returns Lista follower con stato relazione
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

    // 3. Verifica permessi per profili privati
    if (targetProfile.is_private) {
      // Proprietario può sempre vedere
      if (currentProfile?.id !== targetProfile.id) {
        // Verifica se l'utente corrente segue il profilo privato
        const isFollowing = currentProfile 
          ? await profileRepository.isFollowing(currentProfile.id, targetProfile.id)
          : false;

        if (!isFollowing) {
          return NextResponse.json(
            { error: 'Non puoi vedere i follower di un profilo privato' }, 
            { status: 403 }
          );
        }
      }
    }

    // 4. Ottiene i follower con stato relazione usando il repository
    const followers = await profileRepository.getFollowersWithStatus(
      targetProfile.id,
      currentProfile?.id ?? null,
      50, // limite
      0   // offset (TODO: aggiungere paginazione)
    );

    return NextResponse.json({ followers });
  } catch (error) {
    console.error('Errore nel recupero dei follower:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
