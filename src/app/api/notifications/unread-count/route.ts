/**
 * @fileoverview API route for getting unread notifications count
 *
 * This endpoint returns the count of unread notifications for the authenticated user.
 *
 * @module api/notifications/unread-count
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

// ============================================================================
// GET /api/notifications/unread-count
// ============================================================================

/**
 * Get unread notifications count for the authenticated user
 *
 * @param request - Next.js request object
 * @returns Unread count or error response
 */
export async function GET(request: NextRequest) {
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

    // Count unread notifications
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM notifications 
       WHERE recipient_profile_id = ? AND is_read = 0`,
      [profileId]
    );

    return NextResponse.json(
      { count: result?.count || 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
