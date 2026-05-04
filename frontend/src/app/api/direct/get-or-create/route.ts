/**
 * @fileoverview API per ottenere o creare una chat
 *
 * POST /api/direct/get-or-create - Ottiene o crea una chat 1-to-1
 *
 * PATTERN REPOSITORY:
 * Usa DirectMessageRepository per accesso centralizzato ai dati.
 *
 * @module api/direct/get-or-create
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentProfile } from '@/lib/auth';
import { directMessageRepository } from '@/repositories';

/**
 * POST /api/direct/get-or-create
 * Ottiene o crea una chat tra l'utente autenticato e un altro profilo.
 * 
 * Body: { otherProfileId: number }
 */
export async function POST(req: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { otherProfileId } = await req.json();
  
  if (!otherProfileId) {
    return NextResponse.json({ error: 'Manca l\'ID del profilo' }, { status: 400 });
  }

  // Verifica che l'altro profilo esista
  const otherProfileExists = await directMessageRepository.profileExists(otherProfileId);
  if (!otherProfileExists) {
    return NextResponse.json({ error: 'Profilo non trovato' }, { status: 404 });
  }

  // Ottieni o crea la chat usando il repository
  const chatId = await directMessageRepository.getOrCreateChat(profile.id, otherProfileId);

  return NextResponse.json({ chatId });
}
