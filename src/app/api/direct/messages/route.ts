/**
 * API Route: /api/direct/messages
 * Restituisce i messaggi di una chat
 * Query param: chatId
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryAll } from '@/lib/db';

export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ messages: [] }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');
  if (!chatId) return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });

  // Verifica che l'utente sia partecipante attivo
  const isParticipant = await queryAll(
    `SELECT 1 FROM chat_participants WHERE chat_id = ? AND profile_id = ? AND left_at IS NULL`,
    [chatId, profile.id]
  );
  if (!isParticipant.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Recupera i messaggi
  const messages = await queryAll(
    `SELECT m.id, m.sender_profile_id, p.username, m.text, m.created_at
     FROM messages m
     JOIN profiles p ON p.id = m.sender_profile_id
     WHERE m.chat_id = ? AND m.deleted_at IS NULL
     ORDER BY m.created_at DESC
     LIMIT 100`,
    [chatId]
  );

  return NextResponse.json({ messages });
}
