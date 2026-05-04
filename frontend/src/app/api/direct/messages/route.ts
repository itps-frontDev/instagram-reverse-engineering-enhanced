/**
 * @fileoverview API per i messaggi di una chat
 *
 * GET /api/direct/messages?chatId=<id> - Restituisce i messaggi di una chat
 *
 * PATTERN REPOSITORY:
 * Usa DirectMessageRepository per accesso centralizzato ai dati.
 *
 * @module api/direct/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { directMessageRepository } from '@/repositories';

/**
 * GET /api/direct/messages
 * Recupera i messaggi di una chat specifica.
 * 
 * Verifica che l'utente sia partecipante attivo della chat.
 */
export async function GET(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ messages: [] }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const chatId = searchParams.get('chatId');
  
  if (!chatId) {
    return NextResponse.json({ error: 'ID chat mancante' }, { status: 400 });
  }

  const chatIdNum = parseInt(chatId, 10);
  if (isNaN(chatIdNum)) {
    return NextResponse.json({ error: 'ID chat non valido' }, { status: 400 });
  }

  // Verifica che l'utente sia partecipante attivo
  const isParticipant = await directMessageRepository.isParticipant(chatIdNum, profile.id);
  if (!isParticipant) {
    return NextResponse.json({ error: 'Accesso negato' }, { status: 403 });
  }

  // Recupera i messaggi usando il repository
  const messages = await directMessageRepository.getMessages(chatIdNum);

  return NextResponse.json({ messages });
}
