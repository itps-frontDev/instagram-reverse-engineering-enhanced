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

interface Profile {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  website_url: string | null;
  profile_image_url: string | null;
  gender: string | null;
  custom_gender: string | null;
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
    const { website_url, bio, gender, custom_gender } = body;

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

    // Validate gender
    if (gender !== undefined) {
      const validGenders = ['male', 'female', 'prefer_not_to_say', 'custom'];
      if (!validGenders.includes(gender)) {
        return NextResponse.json(
          { error: 'Invalid gender value' },
          { status: 400 }
        );
      }

      // If gender is custom, custom_gender must be provided
      if (gender === 'custom' && (!custom_gender || custom_gender.trim() === '')) {
        return NextResponse.json(
          { error: 'Custom gender is required when gender is set to custom' },
          { status: 400 }
        );
      }
    }

    // Get user's profile_id first
    const profileData = await queryOne<{ id: number }>(
      `SELECT id FROM profiles WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (bio !== undefined) {
      updates.push('bio = ?');
      values.push(bio || null);
    }

    if (website_url !== undefined) {
      updates.push('website_url = ?');
      values.push(website_url || null);
    }

    if (gender !== undefined) {
      updates.push('gender = ?');
      values.push(gender);
      
      // Handle custom_gender based on gender selection
      if (gender === 'custom' && custom_gender) {
        updates.push('custom_gender = ?');
        values.push(custom_gender);
      } else {
        updates.push('custom_gender = ?');
        values.push(null);
      }
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Update profile in database
    values.push(profileData.id);
    await execute(
      `UPDATE profiles
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    // Fetch updated profile
    const updatedProfile = await queryOne<Profile>(
      `SELECT id, username, full_name, bio, website_url, profile_image_url, gender, custom_gender
       FROM profiles
       WHERE id = ?`,
      [profileData.id]
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
