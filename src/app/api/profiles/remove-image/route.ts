/**
 * @fileoverview API per rimuovere l'immagine del profilo
 *
 * DELETE /api/profiles/remove-image - Rimuove l'immagine del profilo
 *
 * Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/remove-image
 */

import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { deleteFile } from '@/lib/storage';

/**
 * DELETE /api/profiles/remove-image
 * Rimuove l'immagine del profilo.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function DELETE() {
  try {
    // Verifica autenticazione
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' }, 
        { status: 401 }
      );
    }

    // Elimina il file fisico se esiste
    if (currentProfile.profile_image_url) {
      try {
        // Estrae filename dall'URL: /api/media/profiles/{id}/{filename}
        const urlParts = currentProfile.profile_image_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        deleteFile('profiles', currentProfile.id, filename);
      } catch (err) {
        console.error('Errore eliminazione immagine profilo:', err);
        // Continua comunque - aggiorna DB anche se eliminazione file fallisce
      }
    }

    // Aggiorna il profilo usando il repository
    await profileRepository.update(currentProfile.id, {
      profile_image_url: '' // stringa vuota = rimuovi immagine
    });

    return NextResponse.json({
      success: true,
      message: 'Immagine profilo rimossa con successo',
    });
  } catch (err) {
    console.error('Errore nella rimozione immagine profilo:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
