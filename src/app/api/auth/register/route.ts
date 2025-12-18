import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import path from 'path';

// Inizializza database
const dbPath = path.join(process.cwd(), 'instagram.db');
const db = new sqlite3.Database(dbPath);

// Crea tabella utenti se non esiste
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    fullName TEXT NOT NULL,
    password TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, username, password } = body;

    // Validazione input
    if (!email || !fullName || !username || !password) {
      return NextResponse.json(
        { error: 'Tutti i campi sono obbligatori' },
        { status: 400 }
      );
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Email non valida' },
        { status: 400 }
      );
    }

    // Validazione username
    if (username.length < 3) {
      return NextResponse.json(
        { error: 'Username deve contenere almeno 3 caratteri' },
        { status: 400 }
      );
    }

    // Validazione password
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password deve contenere almeno 6 caratteri' },
        { status: 400 }
      );
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Salva utente nel database
    return new Promise((resolve) => {
      db.run(
        `INSERT INTO users (email, username, fullName, password) VALUES (?, ?, ?, ?)`,
        [email, username, fullName, hashedPassword],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              if (err.message.includes('email')) {
                resolve(
                  NextResponse.json(
                    { error: 'Email già registrata' },
                    { status: 409 }
                  )
                );
              } else if (err.message.includes('username')) {
                resolve(
                  NextResponse.json(
                    { error: 'Username già in uso' },
                    { status: 409 }
                  )
                );
              }
            } else {
              resolve(
                NextResponse.json(
                  { error: 'Errore durante la registrazione' },
                  { status: 500 }
                )
              );
            }
          } else {
            resolve(
              NextResponse.json(
                { message: 'Registrazione completata con successo', userId: this.lastID },
                { status: 201 }
              )
            );
          }
        }
      );
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
