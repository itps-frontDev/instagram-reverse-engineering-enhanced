/**
 * API Route: /api/direct/get-or-create
 * Ottiene o crea una chat tra l'utente autenticato e un altro profilo
 * Body: { otherProfileId }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { queryOne, queryAll, execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { otherProfileId } = await req.json();
  if (!otherProfileId) return NextResponse.json({ error: 'Missing otherProfileId' }, { status: 400 });

  // Verifica che l'altro profilo esista
  const otherProfile = await queryOne(
    'SELECT id FROM profiles WHERE id = ? AND deleted_at IS NULL',
    [otherProfileId]
  );
  if (!otherProfile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Cerca una chat 1-to-1 esistente tra i due utenti
  const existingChat = await queryOne<{ id: number }>(
    `SELECT c.id
     FROM chats c
     WHERE c.is_group = 0
       AND c.deleted_at IS NULL
       AND EXISTS (
         SELECT 1 FROM chat_participants cp1
         WHERE cp1.chat_id = c.id AND cp1.profile_id = ? AND cp1.left_at IS NULL
       )
       AND EXISTS (
         SELECT 1 FROM chat_participants cp2
         WHERE cp2.chat_id = c.id AND cp2.profile_id = ? AND cp2.left_at IS NULL
       )`,
    [profile.id, otherProfileId]
  );

  if (existingChat) {
    return NextResponse.json({ chatId: existingChat.id });
  }

  // Crea una nuova chat
  const chatResult = await execute(
    'INSERT INTO chats (is_group, created_by_profile_id) VALUES (?, ?)',
    [0, profile.id]
  );

  const chatId = chatResult.lastID;

  // Aggiungi entrambi i partecipanti
  await execute(
    'INSERT INTO chat_participants (chat_id, profile_id, role) VALUES (?, ?, ?)',
    [chatId, profile.id, 'member']
  );

  await execute(
    'INSERT INTO chat_participants (chat_id, profile_id, role) VALUES (?, ?, ?)',
    [chatId, otherProfileId, 'member']
  );

  return NextResponse.json({ chatId });
}
