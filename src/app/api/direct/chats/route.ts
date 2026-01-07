/**
 * API Route: /api/direct/chats
 * Restituisce la lista delle chat dell'utente autenticato + follower/following senza chat
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json({ chats: [] }, { 
        status: 401,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

  // Recupera tutte le chat dove l'utente è partecipante attivo con ultimo messaggio e info altro partecipante
  const chats = await queryAll<{
    id: number;
    is_group: number;
    name: string | null;
    last_message_at: string | null;
    last_message_text: string | null;
    last_message_sender_id: number | null;
    other_profile_id: number | null;
    other_username: string | null;
    other_full_name: string | null;
    other_profile_image_url: string | null;
  }>(`
    SELECT DISTINCT
      c.id, 
      c.is_group, 
      c.name, 
      c.last_message_at,
      (SELECT m.text FROM messages m WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_text,
      (SELECT m.sender_profile_id FROM messages m WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id,
      (SELECT cp2.profile_id FROM chat_participants cp2 WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_profile_id,
      (SELECT p.username FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_username,
      (SELECT p.full_name FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_full_name,
      (SELECT p.profile_image_url FROM chat_participants cp2 JOIN profiles p ON p.id = cp2.profile_id WHERE cp2.chat_id = c.id AND cp2.profile_id != ? AND cp2.left_at IS NULL LIMIT 1) as other_profile_image_url
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.profile_id = ? AND cp.left_at IS NULL AND c.deleted_at IS NULL
    ORDER BY 
      CASE WHEN c.last_message_at IS NULL THEN 1 ELSE 0 END,
      c.last_message_at DESC, 
      c.created_at DESC
    LIMIT 50
  `, [profile.id, profile.id, profile.id, profile.id, profile.id]);

  // Ottieni gli ID dei profili con cui esiste già una chat
  const existingChatProfileIds = new Set(
    chats.map(chat => chat.other_profile_id).filter(id => id !== null)
  );

  // Recupera i follower (persone che seguono l'utente) e following (persone che l'utente segue)
  // che non hanno ancora una chat attiva con l'utente
  const followers = await queryAll<{
    id: number;
    username: string;
    full_name: string | null;
    profile_image_url: string | null;
  }>(`
    SELECT DISTINCT p.id, p.username, p.full_name, p.profile_image_url
    FROM profiles p
    JOIN follows f ON (
      (f.follower_profile_id = p.id AND f.following_profile_id = ?)
      OR
      (f.following_profile_id = p.id AND f.follower_profile_id = ?)
    )
    WHERE f.status = 'accepted' 
      AND f.deleted_at IS NULL 
      AND p.deleted_at IS NULL
      AND p.id != ?
    ORDER BY p.username
    LIMIT 100
  `, [profile.id, profile.id, profile.id]);

  // Filtra i follower che non hanno già una chat
  const followersWithoutChat = followers.filter(f => !existingChatProfileIds.has(f.id));

  // Mappa le chat per il frontend
  const mappedChats = chats.map(chat => ({
    id: chat.id,
    is_group: chat.is_group,
    name: chat.name || chat.other_full_name || chat.other_username,
    last_message_at: chat.last_message_at,
    last_message_text: chat.last_message_text,
    isFromMe: chat.last_message_sender_id === profile.id,
    other_profile_id: chat.other_profile_id,
    other_username: chat.other_username,
    other_full_name: chat.other_full_name,
    other_profile_image_url: chat.other_profile_image_url,
  }));

  // Mappa i follower senza chat come "contatti potenziali"
  const mappedFollowers = followersWithoutChat.map(f => ({
    id: null, // Nessuna chat esistente
    is_group: false,
    name: f.full_name || f.username,
    last_message_at: null,
    last_message_text: null,
    isFromMe: false,
    other_profile_id: f.id,
    other_username: f.username,
    other_full_name: f.full_name,
    other_profile_image_url: f.profile_image_url,
  }));

  // Combina: prima le chat con messaggi (ordinate per data), poi i follower senza chat
  const allContacts = [...mappedChats, ...mappedFollowers];

    return NextResponse.json(
      { chats: allContacts, currentProfileId: profile.id },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('[API] Error in /api/direct/chats:', error);
    return NextResponse.json(
      { chats: [], error: 'Failed to fetch chats' },
      { 
        status: 500,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      }
    );
  }
}
