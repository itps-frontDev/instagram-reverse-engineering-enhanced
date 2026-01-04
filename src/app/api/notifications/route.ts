/**
 * @fileoverview API route for fetching user notifications
 *
 * This endpoint returns all notifications for the authenticated user.
 *
 * @module api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

interface NotificationRow {
  id: number;
  type: string;
  sender_profile_id: number | null;
  sender_username: string | null;
  sender_full_name: string | null;
  sender_profile_image_url: string | null;
  sender_is_verified: number;
  reference_type: string | null;
  reference_id: number | null;
  is_read: number;
  created_at: string;
}

// ============================================================================
// GET /api/notifications
// ============================================================================

/**
 * Get notifications for the authenticated user
 *
 * @param request - Next.js request object
 * @returns Notifications list or error response
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

    // Fetch notifications with sender info
    const rows = await queryAll<NotificationRow>(
      `SELECT 
        n.id,
        n.type,
        n.sender_profile_id,
        n.reference_type,
        n.reference_id,
        n.is_read,
        n.created_at,
        p.username as sender_username,
        p.full_name as sender_full_name,
        p.profile_image_url as sender_profile_image_url,
        p.is_verified as sender_is_verified
      FROM notifications n
      LEFT JOIN profiles p ON n.sender_profile_id = p.id
      WHERE n.recipient_profile_id = ?
      ORDER BY n.created_at DESC
      LIMIT 50`,
      [profileId]
    );

    const notifications = rows.map(row => ({
      ...row,
      is_read: row.is_read === 1,
      sender_is_verified: row.sender_is_verified === 1,
    }));

    return NextResponse.json(
      { notifications },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
