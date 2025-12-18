import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import path from 'path';
import jwt from 'jsonwebtoken';

const dbPath = path.join(process.cwd(), 'instagram.db');
const db = new sqlite3.Database(dbPath);
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validazione input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e password sono obbligatori' },
        { status: 400 }
      );
    }

    // Cerca utente nel database
    return new Promise((resolve) => {
      db.get(
        `SELECT id, email, username, fullName, password FROM users WHERE email = ? OR username = ?`,
        [email, email],
        async (err, user: any) => {
          if (err) {
            resolve(
              NextResponse.json(
                { error: 'Errore del server' },
                { status: 500 }
              )
            );
            return;
          }

          // Utente non trovato
          if (!user) {
            resolve(
              NextResponse.json(
                { error: 'Email o password non validi' },
                { status: 401 }
              )
            );
            return;
          }

          // Verifica password
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            resolve(
              NextResponse.json(
                { error: 'Email o password non validi' },
                { status: 401 }
              )
            );
            return;
          }

          // Genera JWT token
          const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
          );

          // Crea risposta con cookie
          const response = NextResponse.json(
            {
              message: 'Login completato con successo',
              user: {
                id: user.id,
                email: user.email,
                username: user.username,
                fullName: user.fullName,
              },
              token,
            },
            { status: 200 }
          );

          // Imposta cookie httpOnly per sicurezza
          response.cookies.set('authToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 giorni
          });

          resolve(response);
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
