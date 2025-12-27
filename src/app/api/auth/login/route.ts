import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import path from 'path';
import jwt from 'jsonwebtoken';

export const runtime = 'nodejs';

// Configurazione Database
const dbPath = path.join(process.cwd(), 'data', 'instagram.db');
const db = new sqlite3.Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2025';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Inserisci le credenziali complete' },
        { status: 400 }
      );
    }

    return new Promise((resolve) => {
      // Query con JOIN per cercare in entrambe le tabelle
      // Cerchiamo identifier in: users.email, users.phone_number o profiles.username
      const sql = `
        SELECT 
          u.id, 
          u.email, 
          u.phone_number, 
          u.password_hash, 
          p.username, 
          p.full_name
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.email = ? 
           OR u.phone_number = ? 
           OR p.username = ?
        LIMIT 1
      `;

      db.get(sql, [identifier, identifier, identifier], async (err, user: any) => {
        if (err) {
          console.error('Database Error:', err);
          return resolve(
            NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
          );
        }

        // 1. Verifica esistenza utente
        if (!user) {
          return resolve(
            NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
          );
        }

        // 2. Confronto password (usando password_hash come da tuo schema)
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
          return resolve(
            NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 })
          );
        }

        // 3. Generazione JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            username: user.username 
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        // 4. Preparazione risposta
        const response = NextResponse.json(
          {
            message: 'Login completato con successo',
            user: {
              id: user.id,
              email: user.email,
              username: user.username,
              fullName: user.full_name,
            },
            token,
          },
          { status: 200 }
        );

        // 5. Impostazione Cookie HTTP-Only
        response.cookies.set('authToken', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60, // 7 giorni
        });

        resolve(response);
      });
    });
  } catch (error) {
    console.error('Login Route Error:', error);
    return NextResponse.json(
      { error: 'Si è verificato un errore durante l\'accesso' },
      { status: 500 }
    );
  }
}