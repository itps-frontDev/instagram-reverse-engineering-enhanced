/**
 * @fileoverview API per ottenere i propri follower
 *
 * GET /api/profiles/me/followers - Ottiene la lista dei follower dell'utente corrente
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/me/followers
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

/**
 * GET /api/profiles/me/followers
 * Ottiene la lista dei follower dell'utente autenticato.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function GET(req: NextRequest) {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

  // Ottiene i follower usando il repository
  const followers = await profileRepository.getFollowers(currentProfile.id);

  return NextResponse.json({ followers });
}
