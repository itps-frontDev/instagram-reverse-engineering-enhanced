/**
 * @fileoverview API per caricare l'immagine del profilo
 *
 * POST /api/profiles/upload-image - Carica immagine profilo
 *
 * VALIDAZIONI:
 * - Solo formati: JPEG, PNG, WebP, GIF
 * - Dimensione massima: 5MB
 *
 * Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/upload-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { saveFile, deleteFile } from '@/lib/storage';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * POST /api/profiles/upload-image
 * Carica una nuova immagine del profilo.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 */
export async function POST(request: NextRequest) {
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
    // Parsing FormData e validazione file
    // -------------------------------------------------------------------------
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' }, 
        { status: 400 }
      );
    }

    // Validazione tipo file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo di file non valido. Solo JPEG, PNG, WebP e GIF sono consentiti' },
        { status: 400 }
      );
    }

    // Validazione dimensione
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Il file supera il limite di 5MB' },
        { status: 400 }
      );
    }

    // Elimina l'immagine precedente se esiste
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (currentProfile.profile_image_url) {
      try {
        // Estrae filename dall'URL: /api/media/profiles/{id}/{filename}
        const urlParts = currentProfile.profile_image_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        deleteFile('profiles', currentProfile.id, filename);
      } catch (err) {
        console.error('Errore eliminazione vecchia immagine profilo:', err);
        // Continua comunque - non è critico
      }
    }

    // Salva la nuova immagine
    const uploadResult = saveFile(buffer, file.name, 'profiles', currentProfile.id);

    // Aggiorna il profilo usando il repository
    await profileRepository.update(currentProfile.id, {
      profile_image_url: uploadResult.url
    });

    return NextResponse.json({
      success: true,
      profile_image_url: uploadResult.url,
    });
  } catch (err) {
    console.error('Errore nel caricamento immagine profilo:', err);
    return NextResponse.json(
      { error: 'Errore durante il caricamento dell\'immagine del profilo' },
      { status: 500 }
    );
  }
}
