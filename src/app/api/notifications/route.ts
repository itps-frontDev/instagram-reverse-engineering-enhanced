/**
 * @fileoverview API route for fetching user notifications
 *
 * This endpoint returns all notifications for the authenticated user.
 *
 * @module api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryAll } from '@/lib/db';
import { getCurrentProfile } from '@/lib/auth';

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
  reference_image_url: string | null;
  reference_media_type: string | null;
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
    // Get current user's profile
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profileId = currentProfile.id;

    // Fetch notifications with sender info and post preview
    try {
      console.log('[Notifications] Fetching notifications for profile:', profileId);

      // Prima verifica quante notifiche totali ci sono
      const allRows = await queryAll<{ count: number }>(
        `SELECT COUNT(*) as count FROM notifications WHERE recipient_profile_id = ?`,
        [profileId]
      );
      console.log('[Notifications] Total notifications (including deleted):', allRows[0]?.count);

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
          COALESCE(p.is_verified, 0) as sender_is_verified,
          pm.media_url as reference_image_url,
          pm.media_type as reference_media_type
        FROM notifications n
        LEFT JOIN profiles p ON n.sender_profile_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN posts ON n.reference_type = 'post' AND n.reference_id = posts.id AND posts.deleted_at IS NULL
        LEFT JOIN post_media pm ON posts.id = pm.post_id AND pm.position = 0 AND pm.deleted_at IS NULL
        WHERE n.recipient_profile_id = ?
        ORDER BY n.created_at DESC
        LIMIT 50`,
        [profileId]
      );

      console.log('[Notifications] Notifications after deleted_at filter:', rows.length);

      const notifications = rows.map(row => ({
        ...row,
        is_read: row.is_read === 1,
        sender_is_verified: row.sender_is_verified === 1,
      }));

      return NextResponse.json(
        { notifications },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database query error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
