/**
 * @fileoverview API per rimuovere l'immagine del profilo
 *
 * POST /api/profiles/[username]/remove-image
 * - Rimuove l'immagine del profilo
 * - Solo il proprietario può rimuovere
 * - Imposta profile_image_url a null nel database
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/[username]/remove-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

/**
 * POST /api/profiles/[username]/remove-image
 * Rimuove l'immagine del profilo.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
         { status: 401 }
      );
    }

    // Solo il proprietario del profilo può rimuovere l'immagine
    if (currentProfile.username !== username) {
      return NextResponse.json({ error: `Non puoi rimuovere l\'immagine di altri utenti` }, { status: 403 });
    }

    /**
     * Rimuove l'immagine del profilo usando il repository
     * Passiamo una stringa vuota che verrà gestita come null
     */
    await profileRepository.update(currentProfile.id, {
      profile_image_url: '' // stringa vuota = rimuovi immagine
    });

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('Errore nella rimozione immagine profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
