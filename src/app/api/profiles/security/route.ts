/**
 * @fileoverview API route for updating security settings
 *
 * PUT /api/profiles/security - Update email, phone, password
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execute, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

/**
 * PUT /api/profiles/security
 * Update email, phone number, and/or password
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
    const { email, phone_number, current_password, new_password } = body;

    // Get current user data
    const userData = await queryOne<{ id: number; password_hash: string }>(
      `SELECT id, password_hash FROM users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }

      const isValidPassword = await bcrypt.compare(current_password, userData.password_hash);
      if (!isValidPassword) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        );
      }

      if (new_password.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(new_password, 10);
      
      await execute(
        `UPDATE users 
         SET password_hash = ?, updated_at = datetime('now')
         WHERE id = ? AND deleted_at IS NULL`,
        [hashedPassword, userId]
      );
    }

    // Update email and phone if provided
    if (email !== undefined || phone_number !== undefined) {
      // Validate at least one contact method
      if (!email && !phone_number) {
        return NextResponse.json(
          { error: 'At least one contact method (email or phone) is required' },
          { status: 400 }
        );
      }

      // Check if email already exists (if changed)
      if (email) {
        const existingEmail = await queryOne<{ id: number }>(
          `SELECT id FROM users WHERE email = ? AND id != ? AND deleted_at IS NULL`,
          [email, userId]
        );

        if (existingEmail) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 409 }
          );
        }
      }

      // Check if phone already exists (if changed)
      if (phone_number) {
        const existingPhone = await queryOne<{ id: number }>(
          `SELECT id FROM users WHERE phone_number = ? AND id != ? AND deleted_at IS NULL`,
          [phone_number, userId]
        );

        if (existingPhone) {
          return NextResponse.json(
            { error: 'Phone number already in use' },
            { status: 409 }
          );
        }
      }

      await execute(
        `UPDATE users 
         SET email = ?, phone_number = ?, updated_at = datetime('now')
         WHERE id = ? AND deleted_at IS NULL`,
        [email || null, phone_number || null, userId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Security settings updated successfully'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/security] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update security settings' },
      { status: 500 }
    );
  }
}
