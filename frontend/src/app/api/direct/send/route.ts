/**
 * @fileoverview API per l'invio di messaggi
 *
 * POST /api/direct/send - Invia un nuovo messaggio in una chat
 *
 * PATTERN REPOSITORY:
 * Usa DirectMessageRepository per accesso centralizzato ai dati.
 *
 * @module api/direct/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { directMessageRepository } from '@/repositories';

/**
 * POST /api/direct/send
 * Invia un nuovo messaggio in una chat.
 * 
 * Body: { chatId: number, text: string }
 */
export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { chatId, text } = await req.json();
  
  if (!chatId || !text) {
    return NextResponse.json({ error: 'ID chat o testo mancante' }, { status: 400 });
  }

  // Verifica che l'utente sia partecipante attivo
  const isParticipant = await directMessageRepository.isParticipant(chatId, profile.id);
  if (!isParticipant) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
  }

  // Invia il messaggio usando il repository
  const messageId = await directMessageRepository.sendMessage(chatId, profile.id, text);

  return NextResponse.json({ success: true, messageId });
}
