/**
 * @fileoverview API route for accepting a follow request
 */

import { NextRequest, NextResponse } from 'next/server';
import { execute, queryOne } from '@/lib/db';
import { getCurrentProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[Accept] Starting accept follow request');
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      console.log('[Accept] No current profile found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Accept] Current profile:', currentProfile.id);

    const body = await request.json();
    const { followerId } = body;

    console.log('[Accept] Follower ID:', followerId);

    if (!followerId || typeof followerId !== 'number') {
      console.log('[Accept] Invalid follower ID');
      return NextResponse.json(
        { error: 'Follower ID is required' },
        { status: 400 }
      );
    }

    // Verifica che esista una richiesta pending
    console.log('[Accept] Checking for existing follow request');
    const existingFollow = await queryOne<{ id: number; status: string }>(
      `SELECT id, status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [followerId, currentProfile.id]
    );

    console.log('[Accept] Existing follow:', existingFollow);

    if (!existingFollow) {
      console.log('[Accept] Follow request not found');
      return NextResponse.json(
        { error: 'Follow request not found' },
        { status: 404 }
      );
    }

    if (existingFollow.status === 'accepted') {
      console.log('[Accept] Follow request already accepted');
      return NextResponse.json(
        { error: 'Follow request already accepted' },
        { status: 409 }
      );
    }

    // Accetta la richiesta
    console.log('[Accept] Updating follow status to accepted');
    await execute(
      `UPDATE follows
       SET status = 'accepted',
           updated_at = datetime('now')
       WHERE id = ?`,
      [existingFollow.id]
    );

    // Incrementa followers_count per l'utente corrente
    console.log('[Accept] Incrementing followers_count');
    await execute(
      `UPDATE profiles
       SET followers_count = followers_count + 1,
           updated_at = datetime('now')
       WHERE id = ?`,
      [currentProfile.id]
    );

    // Aggiorna la notifica da follow_request a follow
    console.log('[Accept] Updating notification type');
    const updateResult = await execute(
      `UPDATE notifications
       SET type = 'follow'
       WHERE sender_profile_id = ?
         AND recipient_profile_id = ?
         AND type = 'follow_request'`,
      [followerId, currentProfile.id]
    );
    console.log('[Accept] Notification update result:', updateResult);

    // Rimuovi eventuali notifiche follow_accepted duplicate esistenti
    console.log('[Accept] Removing duplicate follow_accepted notifications');
    await execute(
      `DELETE FROM notifications
       WHERE recipient_profile_id = ?
       AND sender_profile_id = ?
       AND type = 'follow_accepted'`,
      [followerId, currentProfile.id]
    );

    // Crea notifica per l'utente che ha fatto la richiesta
    console.log('[Accept] Creating follow_accepted notification');
    await execute(
      `INSERT INTO notifications (recipient_profile_id, sender_profile_id, type, reference_type, reference_id)
       VALUES (?, ?, 'follow_accepted', 'profile', ?)`,
      [followerId, currentProfile.id, currentProfile.id]
    );

    console.log('[Accept] Success!');
    return NextResponse.json({
      success: true,
      message: 'Follow request accepted'
    });
  } catch (error) {
    console.error('[Accept] Error accepting follow request:', error);
    console.error('[Accept] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
