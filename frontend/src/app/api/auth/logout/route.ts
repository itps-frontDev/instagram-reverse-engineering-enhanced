/**
 * @fileoverview API per logout utente
 *
 * POST /api/auth/logout
 * Invalida il cookie di autenticazione per effettuare il logout.
 * 
 * PROCESSO:
 * 1. Crea risposta JSON di successo
 * 2. Imposta il cookie auth_token con maxAge=0 (scadenza immediata)
 * 3. Il browser rimuoverà automaticamente il cookie
 * 
 * NOTA: Non c'è bisogno di invalidare il JWT lato server
 * perché usiamo token stateless. Il logout è effettivo
 * quando il cookie viene rimosso dal browser.
 * 
 * @module api/auth/logout
 */

import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

// Forza runtime Node.js
export const runtime = 'nodejs';

/**
 * Gestisce richiesta POST per logout.
 * 
 * @returns { message: string } con conferma logout
 */
export async function POST() {
  const response = NextResponse.json(
    { message: 'Logout completato con successo' },
    { status: 200 }
  );

  // Invalida il cookie di autenticazione impostando maxAge=0
  // Questo causa la rimozione immediata del cookie dal browser
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Scadenza immediata
  });

  return response;
}
