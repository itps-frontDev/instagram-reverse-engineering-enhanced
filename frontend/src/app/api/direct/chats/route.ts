/**
 * @fileoverview API per la lista delle chat
 *
 * GET /api/direct/chats - Restituisce la lista delle chat dell'utente + contatti potenziali
 *
 * PATTERN REPOSITORY:
 * Usa DirectMessageRepository per accesso centralizzato ai dati.
 *
 * @module api/direct/chats
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { directMessageRepository } from '@/repositories';

/**
 * GET /api/direct/chats
 * Recupera tutte le chat dell'utente e i contatti potenziali (follower/following senza chat).
 */
export async function GET(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ chats: [] }, { 
        status: 401,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // Recupera le chat con dettagli usando il repository
    const chats = await directMessageRepository.getChatsWithDetails(profile.id);

    // Ottieni gli ID dei profili con cui esiste già una chat
    const existingChatProfileIds = new Set(
      chats.map(chat => chat.other_profile_id).filter(id => id !== null)
    );

    // Recupera i follower/following senza chat
    const followers = await directMessageRepository.getFollowersWithoutChat(profile.id);

    // Filtra i follower che non hanno già una chat
    const followersWithoutChat = followers.filter(f => !existingChatProfileIds.has(f.id));

    // Mappa le chat per il frontend
    const mappedChats = directMessageRepository.mapChatsForFrontend(chats, profile.id);

    // Mappa i follower senza chat come "contatti potenziali"
    const mappedFollowers = directMessageRepository.mapContactsAsPotentialChats(followersWithoutChat);

    // Combina: prima le chat con messaggi (ordinate per data), poi i follower senza chat
    const allContacts = [...mappedChats, ...mappedFollowers];

    return NextResponse.json(
      { chats: allContacts, currentProfileId: profile.id },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('[API] Error in /api/direct/chats:', error);
    return NextResponse.json(
      { chats: [], error: 'Impossibile recuperare le chat' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  }
}
