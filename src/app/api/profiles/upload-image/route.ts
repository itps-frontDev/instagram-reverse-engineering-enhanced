/**
 * @fileoverview API route for uploading profile image
 *
 * POST /api/profiles/upload-image - Upload profile picture
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { execute, queryOne } from '@/lib/db';
import { saveFile, deleteFile } from '@/lib/storage';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface Profile {
  id: number;
  profile_image_url: string | null;
}

/**
 * POST /api/profiles/upload-image
 * Upload profile picture
 */
export async function POST(request: NextRequest) {
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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Delete old profile image if exists
    if (profile.profile_image_url) {
      try {
        // Extract filename from URL: /api/media/profiles/{id}/{filename}
        const urlParts = profile.profile_image_url.split('/');
        const filename = urlParts[urlParts.length - 1];
        deleteFile('profiles', profile.id, filename);
      } catch (err) {
        console.error('Error deleting old profile image:', err);
        // Continue anyway - not critical
      }
    }

    // Save new profile image
    const uploadResult = saveFile(buffer, file.name, 'profiles', profile.id);

    // Update profile in database
    await execute(
      `UPDATE profiles
       SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [uploadResult.url, profile.id]
    );

    return NextResponse.json({
      success: true,
      profile_image_url: uploadResult.url,
    });
  } catch (err) {
    console.error('Error uploading profile image:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
