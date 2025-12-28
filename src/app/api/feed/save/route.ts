/**
 * @fileoverview Save/Unsave post API endpoint
 *
 * POST /api/feed/save
 * Toggles save on a post (save if not saved, unsave if already saved)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import type { SavePostRequest, SavePostResponse } from '@/lib/types/feed';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: SavePostRequest = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json(
        { error: 'postId is required' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await queryOne<{ id: number }>(
      'SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already saved
    const existingSave = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM saved_posts
       WHERE profile_id = ?
         AND post_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [currentProfile.id, postId]
    );

    let saved: boolean;

    if (existingSave && !existingSave.deleted_at) {
      // Unsave: soft delete
      await execute(
        `UPDATE saved_posts
         SET deleted_at = datetime('now')
         WHERE id = ?`,
        [existingSave.id]
      );

      saved = false;
    } else if (existingSave && existingSave.deleted_at) {
      // Re-save: restore
      await execute(
        `UPDATE saved_posts
         SET deleted_at = NULL
         WHERE id = ?`,
        [existingSave.id]
      );

      saved = true;
    } else {
      // Create new save
      await execute(
        `INSERT INTO saved_posts (profile_id, post_id)
         VALUES (?, ?)`,
        [currentProfile.id, postId]
      );

      saved = true;
    }

    const response: SavePostResponse = {
      success: true,
      saved,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[Save] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
