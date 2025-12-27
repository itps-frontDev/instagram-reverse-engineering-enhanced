/**
 * @fileoverview API route for checking if user can view profile content
 *
 * This endpoint checks if the current user has permission to view
 * a profile's posts and content.
 *
 * @module api/profiles/[username]/can-view
 */

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Profile, CanViewResponse } from '@/lib/types/profile';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// GET /api/profiles/[username]/can-view
// ============================================================================

/**
 * Check if current user can view profile content.
 *
 * Authentication is optional - logged out users can view public profiles.
 *
 * @param request - Next.js request object
 * @param params - Route parameters containing username
 * @returns Can view status with optional reason
 *
 * @example
 * // Check if can view profile
 * const response = await fetch('/api/profiles/johndoe/can-view');
 * const { canView, reason } = await response.json();
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validate username parameter
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Fetch target profile
    const targetProfile = await queryOne<Profile>(
      'SELECT id, is_private FROM profiles WHERE username = ? AND deleted_at IS NULL',
      [username]
    );

    if (!targetProfile) {
      const response: CanViewResponse = {
        canView: false,
        reason: 'not_found',
      };

      return NextResponse.json(response, { status: 404 });
    }

    // If profile is public, anyone can view
    if (!targetProfile.is_private) {
      const response: CanViewResponse = {
        canView: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Profile is private - check authentication and follow status
    const currentProfile = await getCurrentProfile();

    // Not logged in - cannot view private profile
    if (!currentProfile) {
      const response: CanViewResponse = {
        canView: false,
        reason: 'private',
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // Viewing own profile - can view
    if (currentProfile.id === targetProfile.id) {
      const response: CanViewResponse = {
        canView: true,
      };

      return NextResponse.json(response, {
        status: 200,
        headers: {
          'Cache-Control': 'private, no-cache',
        },
      });
    }

    // Check if following with accepted status
    const follow = await queryOne<{ status: string }>(
      `SELECT status
       FROM follows
       WHERE follower_profile_id = ?
         AND following_profile_id = ?
         AND deleted_at IS NULL`,
      [currentProfile.id, targetProfile.id]
    );

    // Can view if following with accepted status
    const canView = follow?.status === 'accepted';

    const response: CanViewResponse = {
      canView,
      reason: canView ? undefined : 'private',
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('[API] Error checking can view:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
