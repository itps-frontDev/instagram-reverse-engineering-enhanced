/**
 * @fileoverview API per le Informazioni Personali
 *
 * PUT /api/profiles/personal - Aggiorna username e nome completo.
 * 
 * VALIDAZIONE:
 * - Username: solo lettere, numeri, punti e underscore
 * - Username: max 32 caratteri, deve essere unico
 * - Full name: max 64 caratteri
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * 
 * @module api/profiles/personal
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// PUT /api/profiles/personal
// ============================================================================

/**
 * Aggiorna username e nome completo del profilo.
 * 
 * @param request - Richiesta Next.js con { username, full_name }
 * @returns Conferma aggiornamento o errore
 */
export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, full_name } = body;

    // Validazione username
    if (!username || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username obbligatorio' },
        { status: 400 }
      );
    }

    // Formato username: solo lettere, numeri, punti e underscore
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username può contenere solo lettere, numeri, punti e underscore' },
        { status: 400 }
      );
    }

    if (username.length > 32) {
      return NextResponse.json(
        { error: 'Username deve essere massimo 32 caratteri' },
        { status: 400 }
      );
    }

    if (full_name && full_name.length > 64) {
      return NextResponse.json(
        { error: 'Nome completo deve essere massimo 64 caratteri' },
        { status: 400 }
      );
    }

    // Verifica unicità username se cambiato
    // Usa il repository per il check case-insensitive
    if (username.toLowerCase() !== currentProfile.username.toLowerCase()) {
      const usernameTaken = await profileRepository.isUsernameTaken(
        username, 
        currentProfile.id
      );

      if (usernameTaken) {
        return NextResponse.json(
          { error: 'Username già in uso' },
          { status: 409 }
        );
      }
    }

    // Aggiorna il profilo usando il repository
    await profileRepository.update(currentProfile.id, {
      username,
      full_name: full_name || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Informazioni personali aggiornate con successo'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/personal] Errore:', error);
    return NextResponse.json(
      { error: 'Impossibile aggiornare le informazioni personali' },
      { status: 500 }
    );
  }
}
