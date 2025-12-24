import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import path from 'path';

export const runtime = 'nodejs';

const dbPath = path.join(process.cwd(), 'data', 'instagram.db');
const db = new sqlite3.Database(dbPath);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Recuperiamo i dati inviati dal form multi-step
    const { email, password, birthDate, fullName, username } = body;

    // 1. Validazione
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Email, password e username sono obbligatori' }, { status: 400 });
    }

    // Formattazione data di nascita per SQLite
    const dob = birthDate ? `${birthDate.year}-${birthDate.month}-${birthDate.day}` : '2000-01-01';
    const hashedPassword = await bcrypt.hash(String(password), 10);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    return new Promise((resolve) => {
      // Usiamo serialize per assicurarci che le operazioni avvengano in ordine
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // 2. Inserimento in USERS
        const sqlUser = `
          INSERT INTO users (email, password_hash, date_of_birth, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?)
        `;
        
        db.run(sqlUser, [email, hashedPassword, dob, now, now], function (err) {
          if (err) {
            db.run('ROLLBACK');
            if (err.message.includes('UNIQUE constraint failed')) {
              return resolve(NextResponse.json({ error: 'Email già registrata' }, { status: 409 }));
            }
            return resolve(NextResponse.json({ error: 'Errore inserimento utente' }, { status: 500 }));
          }

          const lastUserId = this.lastID;

          // 3. Inserimento in PROFILES (popolato automaticamente)
          const sqlProfile = `
            INSERT INTO profiles (user_id, username, full_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.run(sqlProfile, [lastUserId, username, fullName, now, now], (errProfile) => {
            if (errProfile) {
              db.run('ROLLBACK');
              if (errProfile.message.includes('UNIQUE constraint failed')) {
                return resolve(NextResponse.json({ error: 'Nome utente già esistente' }, { status: 409 }));
              }
              return resolve(NextResponse.json({ error: 'Errore creazione profilo' }, { status: 500 }));
            }

            // Se tutto va bene, conferma
            db.run('COMMIT');
            resolve(
              NextResponse.json({
                message: 'Registrazione completata con successo',
                userId: lastUserId,
                username: username
              }, { status: 201 })
            );
          });
        });
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}