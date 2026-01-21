/**
 * @fileoverview API per anteprima profilo
 * 
 * GET /api/profiles/[username]/preview
 * Restituisce le info del profilo con i post recenti per la card di anteprima.
 * Usato quando si fa hover sul nome utente.
 *
 * NOTA: Utilizza ProfileRepository e PostRepository per tutte le query.
 * I contatori sono già denormalizzati nel profilo.
 * 
 * @module api/profiles/[username]/preview
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { profileRepository } from '@/repositories';
import { postRepository } from '@/repositories/PostRepository';
import { ProfilePreviewResponse } from '@/types/profile';

/**
 * GET /api/profiles/[username]/preview
 * Ottiene i dati di anteprima per un profilo.
 * 
 * Richiede autenticazione via cookie HTTP-only.
 * 
 * @returns Dati profilo con post recenti
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    // 1. Autenticazione
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    const { username } = await params;

    // 2. Ottiene il profilo usando il repository
    const profile = await profileRepository.findByUsername(username);
    if (!profile) {
      return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
    }

    // 3. Ottiene il profilo corrente per verificare lo stato di follow
    const currentUserProfile = await profileRepository.findByUserId(user.id);

    // 4. Verifica se l'utente corrente segue questo profilo
    let isFollowing = false;
    if (currentUserProfile) {
      isFollowing = await profileRepository.isFollowing(
        currentUserProfile.id,
        profile.id
      );
    }

    // 5. Ottiene i post recenti solo se può visualizzarli
    const canViewPosts = !profile.is_private || isFollowing;
    const recentPosts = canViewPosts 
      ? await postRepository.getRecentPostsForPreview(profile.id, 3)
      : [];

    // 6. Costruisce la risposta
    const response: ProfilePreviewResponse = {
      id: profile.id,
      username: profile.username,
      full_name: profile.full_name,
      bio: profile.bio,
      profile_image_url: profile.profile_image_url,
      is_verified: profile.is_verified,
      is_private: profile.is_private,
      posts_count: profile.posts_count || 0,
      followers_count: profile.followers_count || 0,
      following_count: profile.following_count || 0,
      is_following: isFollowing,
      recent_posts: recentPosts,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Profile Preview] Errore:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
