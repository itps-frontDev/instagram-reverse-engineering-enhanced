/**
 * API Route: /api/direct/chats
 * Restituisce la lista delle chat dell'utente autenticato
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ chats: [] }, { status: 401 });

  // Recupera tutte le chat dove l'utente è partecipante attivo con ultimo messaggio
  const chats = await queryAll<{
    id: number;
    is_group: number;
    name: string | null;
    last_message_at: string | null;
    last_message_text: string | null;
    last_message_sender: string | null;
  }>(`
    SELECT DISTINCT
      c.id, 
      c.is_group, 
      c.name, 
      c.last_message_at,
      (SELECT m.text FROM messages m WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_text,
      (SELECT p.username FROM messages m JOIN profiles p ON p.id = m.sender_profile_id WHERE m.chat_id = c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) as last_message_sender
    FROM chats c
    JOIN chat_participants cp ON cp.chat_id = c.id
    WHERE cp.profile_id = ? AND cp.left_at IS NULL AND c.deleted_at IS NULL
    ORDER BY c.last_message_at DESC, c.created_at DESC
    LIMIT 50
  `, [profile.id]);

  return NextResponse.json({ chats });
}
