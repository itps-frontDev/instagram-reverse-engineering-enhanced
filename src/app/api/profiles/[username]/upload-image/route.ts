/**
 * @fileoverview API endpoint for uploading profile image
 *
 * POST /api/profiles/[username]/upload-image
 * - Uploads a new profile picture
 * - Only the profile owner can upload
 * - Validates file type (images only)
 * - Saves file to storage and updates database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute } from '@/lib/db';
import { saveFile } from '@/lib/storage';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  try {
    // 1. Verificare autenticazione
    const currentProfile = await getCurrentProfile();
    if (!currentProfile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verificare che l'utente stia caricando la propria immagine
    if (currentProfile.username !== username) {
      return NextResponse.json({ error: 'Cannot upload image for other users' }, { status: 403 });
    }

    // 3. Ottenere file da FormData
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 4. Validare tipo file (solo immagini)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // 5. Validare dimensione file (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 6. Convertire in Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 7. Salvare con storage.ts
    const result = saveFile(buffer, file.name, 'profiles', currentProfile.id);

    // 8. Aggiornare database
    await execute(
      'UPDATE profiles SET profile_image_url = ?, updated_at = datetime("now") WHERE id = ?',
      [result.url, currentProfile.id]
    );

    // 9. Restituire nuovo URL
    return NextResponse.json({
      success: true,
      imageUrl: result.url
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
