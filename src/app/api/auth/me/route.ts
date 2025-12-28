/**
 * @fileoverview Current user API endpoint
 *
 * GET /api/auth/me
 * Returns the currently authenticated user's profile
 */

import { NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const profile = await getCurrentProfile();

    if (!profile) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Convert SQLite integers to booleans
    const profileData = {
      ...profile,
      is_private: Boolean(profile.is_private),
      is_verified: Boolean(profile.is_verified),
    };

    return NextResponse.json(
      { profile: profileData },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Me] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
