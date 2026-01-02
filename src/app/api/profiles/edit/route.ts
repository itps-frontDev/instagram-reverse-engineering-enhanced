/**
 * @fileoverview API route for editing user profile
 *
 * PUT /api/profiles/edit - Update user profile information
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { execute, queryOne } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

interface User {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  website_url: string | null;
  profile_image_url: string | null;
}

/**
 * PUT /api/profiles/edit
 * Update user profile (bio, website)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as number;

    // Parse request body
    const body = await request.json();
    const { website_url, bio } = body;

    // Validation
    if (bio && bio.length > 150) {
      return NextResponse.json(
        { error: 'Bio must be 150 characters or less' },
        { status: 400 }
      );
    }

    if (website_url && website_url.length > 0) {
      // Basic URL validation
      try {
        new URL(website_url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid website URL' },
          { status: 400 }
        );
      }
    }

    // Update profile in database
    await execute(
      `UPDATE users
       SET bio = ?, website_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [bio || null, website_url || null, userId]
    );

    // Fetch updated profile
    const updatedProfile = await queryOne<User>(
      `SELECT id, username, full_name, bio, website_url, profile_image_url
       FROM users
       WHERE id = ?`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
