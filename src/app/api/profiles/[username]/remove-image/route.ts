/**
 * @fileoverview API endpoint for removing profile image
 *
 * POST /api/profiles/[username]/remove-image
 * - Removes the profile picture
 * - Only the profile owner can remove
 * - Sets profile_image_url to null in database
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute } from '@/lib/db';

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

    // 2. Verificare che l'utente stia rimuovendo la propria immagine
    if (currentProfile.username !== username) {
      return NextResponse.json({ error: 'Cannot remove image for other users' }, { status: 403 });
    }

    // 3. Aggiornare database (rimuovere URL)
    await execute(
      'UPDATE profiles SET profile_image_url = NULL, updated_at = datetime("now") WHERE id = ?',
      [currentProfile.id]
    );

    // 4. Restituire successo
    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully'
    });
  } catch (error) {
    console.error('Error removing profile image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
