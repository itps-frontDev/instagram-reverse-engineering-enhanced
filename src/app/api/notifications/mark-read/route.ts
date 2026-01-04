/**
 * @fileoverview API route for marking notifications as read
 *
 * This endpoint marks all notifications as read for the authenticated user.
 *
 * @module api/notifications/mark-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ============================================================================
// PATCH /api/notifications/mark-read
// ============================================================================

/**
 * Mark all notifications as read for the authenticated user
 *
 * @param request - Next.js request object
 * @returns Success response or error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get auth token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token and get profile ID
    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const profileId = decoded.id;

    // Mark all notifications as read
    await execute(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE recipient_profile_id = ? AND is_read = 0`,
      [profileId]
    );

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
