/**
 * @fileoverview API per caricare l'immagine del profilo
 *
 * POST /api/profiles/[username]/upload-image
 * - Carica una nuova immagine del profilo
 * - Solo il proprietario può caricare
 * - Valida il tipo di file (solo immagini)
 * - Salva il file nello storage e aggiorna il database
 *
 * REFACTORING: Usa ProfileRepository invece di query dirette.
 * 
 * @module api/profiles/[username]/upload-image
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { saveFile } from '@/lib/storage';

/**
 * POST /api/profiles/[username]/upload-image
 * Carica una nuova immagine del profilo.
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

    // Solo il proprietario del profilo può caricare l'immagine
    if (currentProfile.username !== username) {
      return NextResponse.json(
        { error: `Solo il proprietario può caricare l\'immagine` },
        { status: 403 }
      );
    }

    // Parsing FormData e validazione file
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nessun file fornito' }, { status: 400 });
    }

    // Validazione tipo: solo immagini
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: `Il file deve essere un\'immagine` }, { status: 400 });
    }

    // Validazione dimensione: max 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File troppo grande (max 5MB)' }, { status: 400 });
    }

    // Salva il file nello storage
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const result = saveFile(buffer, file.name, 'profiles', currentProfile.id);

    // Aggiorna il profilo usando il repository
    await profileRepository.update(currentProfile.id, {
      profile_image_url: result.url
    });

    return NextResponse.json({
      success: true,
      imageUrl: result.url
    });
  } catch (error) {
    console.error('Errore nel caricamento immagine profilo:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
