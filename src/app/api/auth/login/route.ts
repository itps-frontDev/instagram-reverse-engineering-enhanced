/**
 * @fileoverview API Endpoint di Login
 *
 * Gestisce l'autenticazione utente con email/telefono/username e password.
 * Restituisce un token JWT in un cookie HTTP-only dopo login riuscito.
 * 
 * FLUSSO DI AUTENTICAZIONE:
 * 1. Riceve credenziali (identifier + password)
 * 2. Cerca utente tramite UserRepository
 * 3. Verifica password con bcrypt
 * 4. Genera token JWT
 * 5. Imposta cookie HTTP-only con il token
 * 
 * SICUREZZA:
 * - Password MAI salvate in chiaro, solo hash bcrypt
 * - Token in cookie HTTP-only (non accessibile da JavaScript)
 * - Cookie secure in produzione (solo HTTPS)
 * 
 * @module api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories';
import { generateToken } from '@/lib/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth';
import { config } from '@/lib/config';

// Forza l'uso del runtime Node.js (necessario per bcrypt)
export const runtime = 'nodejs';

/**
 * POST /api/auth/login
 * 
 * Autentica un utente e restituisce un token JWT.
 * 
 * @param request - Richiesta con body { email, password, redirect? }
 * @returns Risposta con dati utente e cookie di autenticazione
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { email: identifier, password, redirect } = body;

    // Normalizza identifier in minuscolo per confronto case-insensitive
    identifier = identifier?.trim().toLowerCase();

    // Validazione input
    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Inserisci le credenziali complete' },
        { status: 400 }
      );
    }

    // Cerca utente tramite repository
    // findByCredentials cerca in email, phone_number e username
    const user = await userRepository.findByCredentials(identifier);

    // Verifica che l'utente esista
    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Verifica password usando bcrypt
    // bcrypt.compare confronta password in chiaro con hash salvato
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Aggiorna timestamp ultimo login
    await userRepository.updateLastLogin(user.id);

    // Genera token JWT con payload utente
    const token = await generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Prepara risposta con dati utente (senza password!)
    const response = NextResponse.json(
      {
        message: 'Login completato con successo',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.full_name,
        },
        redirectTo: redirect || '/',
      },
      { status: 200 }
    );

    // Imposta cookie HTTP-only con configurazione da config.ts
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: config.jwt.cookie.httpOnly,
      secure: config.jwt.cookie.secure,
      sameSite: config.jwt.cookie.sameSite,
      path: config.jwt.cookie.path,
      maxAge: config.jwt.cookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error('Errore durante il login:', error);
    return NextResponse.json(
      { error: "Si è verificato un errore durante l'accesso" },
      { status: 500 }
    );
  }
}
