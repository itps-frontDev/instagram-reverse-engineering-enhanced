/**
 * @fileoverview API route for removing profile image
 *
 * DELETE /api/profiles/remove-image - Remove profile picture
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { execute, queryOne } from '@/lib/db';
import { deleteFile } from '@/lib/storage';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface Profile {
  id: number;
  profile_image_url: string | null;
}

/**
 * DELETE /api/profiles/remove-image
 * Remove profile picture
 */
export async function DELETE() {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.id as number;

    // Get profile
    const profile = await queryOne<Profile>(
      `SELECT id, profile_image_url FROM profiles WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Delete profile image if exists
    if (profile.profile_image_url) {
      try {
        deleteFile(profile.profile_image_url);
      } catch (err) {
        console.error('Error deleting profile image:', err);
        // Continue anyway - update DB even if file deletion fails
      }
    }

    // Update profile in database
    await execute(
      `UPDATE profiles
       SET profile_image_url = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [profile.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Profile image removed successfully',
    });
  } catch (err) {
    console.error('Error removing profile image:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
