/**
 * @fileoverview API per la Modifica del Profilo
 *
 * PUT /api/profiles/edit - Aggiorna bio, website, genere del profilo.
 * 
 * PATTERN REPOSITORY:
 * Usa profileRepository per accesso centralizzato al database.
 * Il metodo update() gestisce dinamicamente i campi da aggiornare.
 * 
 * @module api/profiles/edit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';

// ============================================================================
// PUT /api/profiles/edit
// ============================================================================

/**
 * Aggiorna le informazioni del profilo (bio, website, genere).
 * 
 * @param request - Richiesta Next.js con body JSON
 * @returns Profilo aggiornato o errore
 */
export async function PUT(request: NextRequest) {
  try {
    // Verifica autenticazione usando helper centralizzato
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    // Parsing del body della richiesta
    const body = await request.json();
    const { website_url, bio, gender, custom_gender } = body;


    // -------------------
    // Validazione campi
    // -------------------

    // Validazione bio
    if (bio && bio.length > 150) {
      return NextResponse.json(
        { error: 'La bio deve contenere al massimo 150 caratteri' },
        { status: 400 }
      );
    }

    if (website_url && website_url.length > 0) {
      // L'URL del sito web deve essere valida
      try {
        new URL(website_url);
      } catch {
        return NextResponse.json(
          { error: 'URL del sito web non valida' },
          { status: 400 }
        );
      }
    }

    // Validazione genere
    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'prefer_not_to_say', 'custom'];
      if (!validGenders.includes(gender)) {
        return NextResponse.json(
          { error: 'Valore di genere non valido' },
          { status: 400 }
        );
      }

      // Se il genere è personalizzato, custom_gender deve essere fornito
      if (gender === 'custom' && (!custom_gender || custom_gender.trim() === '')) {
        return NextResponse.json(
          { error: 'Il genere personalizzato è obbligatorio quando il genere è impostato su personalizzato' },
          { status: 400 }
        );
      }
    }

    // Usa il repository per aggiornare il profilo
    // Il metodo update gestisce dinamicamente i campi forniti

    // Costruisce l'oggetto di aggiornamento con i campi forniti
    // Il repository gestisce dinamicamente solo i campi definiti
    await profileRepository.update(currentProfile.id, {
      bio: bio !== undefined ? (bio || null) : undefined,
      website_url: website_url !== undefined ? (website_url || null) : undefined,
      gender: gender,
      custom_gender: gender === 'custom' ? custom_gender : (gender !== undefined ? null : undefined),
    });

    // Recupera il profilo aggiornato usando il repository
    const updatedProfile = await profileRepository.findById(currentProfile.id);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('[PUT /api/profiles/edit] Errore:', err);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
