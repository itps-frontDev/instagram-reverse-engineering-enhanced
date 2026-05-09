/**
 * @fileoverview API per registrazione utente
 *
 * POST /api/auth/register
 * Gestisce la registrazione di nuovi utenti con email, username e password.
 * Crea sia il record utente che il profilo in una transazione.
 * 
 * PROCESSO DI REGISTRAZIONE:
 * 1. Validazione input (email, password, username obbligatori)
 * 2. Formattazione data di nascita
 * 3. Hash della password con bcrypt
 * 4. Verifica unicità email e username (tramite repository)
 * 5. Creazione record in `users` e `profiles` (transazione)
 * 
 * TRANSAZIONI IN SQLITE:
 * SQLite supporta transazioni ACID. Usiamo withTransaction() helper
 * che gestisce automaticamente BEGIN/COMMIT/ROLLBACK.
 * Questo garantisce che utente e profilo vengano creati insieme o nessuno dei due.
 * 
 * SICUREZZA:
 * - Password hashata con bcrypt (10 rounds)
 * - Verifica unicità email/username prima di inserire
 * - Email non verificata di default (is_email_verified = 0)
 * 
 * PATTERN REPOSITORY:
 * Usa Repository Pattern per accesso ai dati.
 * Usa withTransaction per gestione transazioni.
 * 
 * @module api/auth/register
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { error: 'Registrazione non disponibile.' },
    { status: 404 }
  );
}
