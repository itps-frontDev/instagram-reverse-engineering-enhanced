/**
 * @fileoverview API route for updating personal info (username, full_name)
 *
 * PUT /api/profiles/personal - Update username and full name
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execute, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

/**
 * PUT /api/profiles/personal
 * Update username and full name
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = payload.id;

    const body = await request.json();
    const { username, full_name } = body;

    // Validation
    if (!username || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9._]+$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, dots and underscores' },
        { status: 400 }
      );
    }

    if (username.length > 32) {
      return NextResponse.json(
        { error: 'Username must be 32 characters or less' },
        { status: 400 }
      );
    }

    if (full_name && full_name.length > 64) {
      return NextResponse.json(
        { error: 'Full name must be 64 characters or less' },
        { status: 400 }
      );
    }

    // Get user's profile
    const profileData = await queryOne<{ id: number; username: string }>(
      `SELECT id, username FROM profiles WHERE user_id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!profileData) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Check if username is already taken (if changed)
    if (username.toLowerCase() !== profileData.username.toLowerCase()) {
      const existingProfile = await queryOne<{ id: number }>(
        `SELECT id FROM profiles WHERE LOWER(username) = LOWER(?) AND id != ? AND deleted_at IS NULL`,
        [username, profileData.id]
      );

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 409 }
        );
      }
    }

    // Update profile
    await execute(
      `UPDATE profiles 
       SET username = ?, full_name = ?, updated_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`,
      [username, full_name || null, profileData.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Personal info updated successfully'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/personal] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update personal info' },
      { status: 500 }
    );
  }
}
