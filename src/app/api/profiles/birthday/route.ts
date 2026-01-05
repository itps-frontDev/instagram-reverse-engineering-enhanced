/**
 * @fileoverview API route for updating birthday
 *
 * PUT /api/profiles/birthday - Update date of birth
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { execute, queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

/**
 * PUT /api/profiles/birthday
 * Update date of birth
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
    const { date_of_birth } = body;

    // Validation
    if (!date_of_birth) {
      return NextResponse.json(
        { error: 'Date of birth is required' },
        { status: 400 }
      );
    }

    // Validate date format and that user is old enough (13+)
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      // Haven't had birthday this year yet
    }

    if (age < 13) {
      return NextResponse.json(
        { error: 'You must be at least 13 years old to use Instagram' },
        { status: 400 }
      );
    }

    // Get user data
    const userData = await queryOne<{ id: number }>(
      `SELECT id FROM users WHERE id = ? AND deleted_at IS NULL`,
      [userId]
    );

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update date of birth
    await execute(
      `UPDATE users 
       SET date_of_birth = ?, updated_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`,
      [date_of_birth, userId]
    );

    return NextResponse.json({
      success: true,
      message: 'Date of birth updated successfully'
    });
  } catch (error) {
    console.error('[PUT /api/profiles/birthday] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update date of birth' },
      { status: 500 }
    );
  }
}
