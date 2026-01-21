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
import bcrypt from 'bcryptjs';
import { withTransaction } from '@/lib/db';
import { userRepository, profileRepository } from '@/repositories';

// Forza runtime Node.js per bcrypt e accesso DB
export const runtime = 'nodejs';

/**
 * Errore personalizzato per conflitti di unicità.
 */
class ConflictError extends Error {
  constructor(public field: 'email' | 'username') {
    super(field === 'email' ? 'Email già registrata' : 'Nome utente già esistente');
    this.name = 'ConflictError';
  }
}

/**
 * Gestisce richiesta POST per registrazione nuovo utente.
 * 
 * @param request - Body JSON con: email, password, username, birthDate?, fullName?
 * @returns { message, userId, username } o errore
 * 
 * Codici di stato:
 * - 201: Registrazione completata
 * - 400: Dati mancanti
 * - 409: Email o username già esistenti (Conflict)
 * - 500: Errore server
 */
export async function POST(request: NextRequest) {
  try {
    // Parse body JSON
    const body = await request.json();
    const { email, password, birthDate, fullName, username } = body;

    // Validazione campi obbligatori
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password e username sono obbligatori' },
        { status: 400 }
      );
    }

    /**
     * Formatta data di nascita per SQLite (YYYY-MM-DD).
     * Se non fornita, usa data di default.
     * NOTA: In produzione si dovrebbe validare l'età minima.
     */
    const dob = birthDate
      ? `${birthDate.year}-${String(birthDate.month).padStart(2, '0')}-${String(birthDate.day).padStart(2, '0')}`
      : '2000-01-01';

    /**
     * Hash della password con bcrypt.
     * Il parametro 10 è il "cost factor" (numero di rounds).
     * Più alto = più sicuro ma più lento.
     * 10 è un buon compromesso per la maggior parte delle applicazioni.
     */
    const hashedPassword = await bcrypt.hash(String(password), 10);

    try {
      // Esegui registrazione in una transazione atomica
      const { userId, username: createdUsername } = await withTransaction(async () => {
        /**
         * Verifica unicità usando i Repository.
         * REFACTORING: Prima usavamo query dirette, ora usiamo il repository
         * per una migliore separazione delle responsabilità.
         */
        
        // Verifica se email già registrata
        const existingEmail = await userRepository.findByEmail(email);
        if (existingEmail) {
          throw new ConflictError('email');
        }

        // Verifica se username già esistente
        const existingUsername = await profileRepository.findByUsername(username);
        if (existingUsername) {
          throw new ConflictError('username');
        }

        /**
         * Crea nuovo utente usando userRepository.
         */
        const userId = await userRepository.create({
          email,
          password_hash: hashedPassword,
          date_of_birth: dob,
        });

        /**
         * Crea profilo associato usando profileRepository.
         * Il profilo è separato dall'utente per:
         * - Possibilità di avere più profili per utente (future)
         * - Separazione dati di autenticazione da dati pubblici
         */
        await profileRepository.create({
          user_id: userId,
          username,
          full_name: fullName || '',
        });

        return { userId, username };
      });

      return NextResponse.json(
        {
          message: 'Registrazione completata con successo',
          userId,
          username: createdUsername,
        },
        { status: 201 } // Created
      );
    } catch (dbError: any) {
      // Gestione ConflictError (unicità)
      if (dbError instanceof ConflictError) {
        return NextResponse.json(
          { error: dbError.message },
          { status: 409 }
        );
      }

      console.error('[Register] Errore database:', dbError);

      /**
       * Gestione violazioni vincolo UNIQUE.
       * Anche se abbiamo già verificato, potrebbero verificarsi
       * race condition con richieste concorrenti.
       */
      if (dbError.message?.includes('UNIQUE constraint failed')) {
        if (dbError.message.includes('email')) {
          return NextResponse.json(
            { error: 'Email già registrata' },
            { status: 409 }
          );
        }
        if (dbError.message.includes('username')) {
          return NextResponse.json(
            { error: 'Nome utente già esistente' },
            { status: 409 }
          );
        }
      }

      // Rilancia l'errore per essere catturato dal catch esterno
      throw dbError;
    }
  } catch (error) {
    console.error('[Register] Errore:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
