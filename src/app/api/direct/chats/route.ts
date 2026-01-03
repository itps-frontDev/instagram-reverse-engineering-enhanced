/**
 * API Route: /api/direct/chats
 * Restituisce la lista delle chat dell'utente autenticato
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(req: NextRequest) {
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
    ORDER BY c.last_message_at DESC, c.created_at DESC
    LIMIT 50
  `, [profile.id, profile.id, profile.id, profile.id, profile.id]);

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

  return NextResponse.json(
    { chats: mappedChats, currentProfileId: profile.id },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
