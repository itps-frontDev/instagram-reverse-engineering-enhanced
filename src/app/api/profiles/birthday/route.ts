/**
 * @fileoverview API per aggiornare la data di nascita
 *
 * PUT /api/profiles/birthday - Aggiorna la data di nascita dell'utente
 *
 * VALIDAZIONI:
 * - Data di nascita obbligatoria
 * - Età minima: 13 anni (requisito Instagram)
 *
 * REFACTORING: Usa UserRepository invece di query dirette.
 * 
 * @module api/profiles/birthday
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { userRepository } from '@/repositories';

/**
 * PUT /api/profiles/birthday
 * Aggiorna la data di nascita dell'utente.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 * Valida che l'utente abbia almeno 13 anni.
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

    // -------------------------------------------------------------------------
    // Parsing e validazione del body
    // -------------------------------------------------------------------------
    const body = await request.json();
    const { date_of_birth } = body;

    if (!date_of_birth) {
      return NextResponse.json(
        { error: 'Data di nascita richiesta' },
        { status: 400 }
      );
    }

    /**
     * Validazioni della data di nascita
     * - Deve essere una data valida
     * - Deve avere almeno 13 anni
     */
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Se non ha ancora compiuto gli anni quest'anno, sottrai 1
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 13) {
      return NextResponse.json(
        { error: 'Devi avere almeno 13 anni per usare Instagram' },
        { status: 400 }
      );
    }

    // Aggiorna la data di nascita usando il repository
    await userRepository.updateDateOfBirth(currentProfile.user_id, date_of_birth);

    return NextResponse.json({
      success: true,
      message: 'Data di nascita aggiornata con successo'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/birthday] Errore:', error);
    return NextResponse.json(
      { error: `Errore durante l\'aggiornamento della data di nascita` },
      { status: 500 }
    );
  }
}
