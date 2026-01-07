/**
 * API Route: /api/direct/send
 * Invia un nuovo messaggio in una chat
 * Body: { chatId, text }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { execute } from '@/lib/db';

export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { chatId, text } = await req.json();
  if (!chatId || !text) return NextResponse.json({ error: 'Missing chatId or text' }, { status: 400 });

  // Verifica che l'utente sia partecipante attivo
  // (opzionale: verifica che la chat esista)
  // Inserisci il messaggio
  const result = await execute(
    `INSERT INTO messages (chat_id, sender_profile_id, text) VALUES (?, ?, ?)`,
    [chatId, profile.id, text]
  );

  // Aggiorna last_message_at sulla chat (usa timestamp in millisecondi)
  const now = Date.now();
  await execute(
    `UPDATE chats SET last_message_at = ? WHERE id = ?`,
    [now, chatId]
  );

  return NextResponse.json({ success: true, messageId: result.lastID });
}
