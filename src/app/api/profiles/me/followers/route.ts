import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';
import { Profile } from '@/lib/types/profile';

// GET /api/profiles/me/followers
export async function GET(req: NextRequest) {
  const currentProfile = await getCurrentProfile();
  if (!currentProfile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Trova tutti i profili che seguono l'utente autenticato
  const followers = await queryAll<Profile>(
    `SELECT p.*
     FROM follows f
     JOIN profiles p ON f.follower_profile_id = p.id
     WHERE f.following_profile_id = ?
       AND f.status = 'accepted'
       AND f.deleted_at IS NULL
       AND p.deleted_at IS NULL`,
    [currentProfile.id]
  );

  return NextResponse.json({ followers });
}
