/**
 * @fileoverview API per aggiornare le impostazioni di sicurezza
 *
 * PUT /api/profiles/security - Aggiorna email, telefono, password
 *
 * FUNZIONALITÀ:
 * - Cambio password (richiede verifica password attuale)
 * - Aggiornamento email
 * - Aggiornamento numero di telefono
 *
 * VALIDAZIONI:
 * - Almeno un metodo di contatto (email o telefono) deve essere presente
 * - Password minimo 6 caratteri
 * - Email/telefono devono essere unici nel sistema
 *
 * REFACTORING: Usa UserRepository invece di query dirette.
 * 
 * @module api/profiles/security
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { userRepository } from '@/repositories';
import bcrypt from 'bcryptjs';


/**
 * PUT /api/profiles/security
 * Aggiorna email, telefono e/o password dell'utente.
 * 
 * Richiede autenticazione via cookie HTTP-only.
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

    // Parsing del body della richiesta
    const body = await request.json();
    const { email, phone_number, current_password, new_password } = body;

    // Recupera utente con password per verifica
    const userData = await userRepository.findWithPasswordById(currentProfile.user_id);

    if (!userData) {
      return NextResponse.json(
        { error: 'Utente non trovato' },
        { status: 404 }
      );
    }

    /**
     * Gestione cambio password
     * Richiede la password attuale per sicurezza
     */
    if (new_password) {
      // Verifica che sia stata fornita la password attuale
      if (!current_password) {
        return NextResponse.json(
          { error: 'Password attuale richiesta per cambiarla' },
          { status: 400 }
        );
      }

      // Verifica la password attuale usando bcrypt
      const isValidPassword = await bcrypt.compare(current_password, userData.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Password attuale non corretta' },
          { status: 401 }
        );
      }

      // Validazione lunghezza minima nuova password
      if (new_password.length < 6) {
        return NextResponse.json(
          { error: 'La nuova password deve essere di almeno 6 caratteri' },
          { status: 400 }
        );
      }

      // Hash e salvataggio nuova password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await userRepository.updatePassword(currentProfile.user_id, hashedPassword);
    }

    // Gestione aggiornamento contatti (email/telefono)
    if (email !== undefined || phone_number !== undefined) {
      // Validazione: almeno un metodo di contatto deve essere presente
      if (!email && !phone_number) {
        return NextResponse.json(
          { error: 'Almeno un metodo di contatto (email o telefono) è richiesto' },
          { status: 400 }
        );
      }

      // Verifica unicità email (escludendo l'utente corrente)
      if (email) {
        const emailTaken = await userRepository.isEmailTaken(email, currentProfile.user_id);
        if (emailTaken) {
          return NextResponse.json(
            { error: 'Email già in uso' },
            { status: 409 }
          );
        }
      }

      // Verifica unicità telefono (escludendo l'utente corrente)
      if (phone_number) {
        const phoneTaken = await userRepository.isPhoneTaken(phone_number, currentProfile.user_id);
        if (phoneTaken) {
          return NextResponse.json(
            { error: 'Numero di telefono già in uso' },
            { status: 409 }
          );
        }
      }

      // Aggiorna i contatti usando il repository
      await userRepository.updateContactInfo(
        currentProfile.user_id, 
        email || null, 
        phone_number || null
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Impostazioni di sicurezza aggiornate con successo'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/security] Errore:', error);
    return NextResponse.json(
      { error: `Errore durante l\'aggiornamento delle impostazioni di sicurezza` },
      { status: 500 }
    );
  }
}
