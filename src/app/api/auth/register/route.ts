/**
 * @fileoverview Register API endpoint
 *
 * Handles new user registration with email, username, and password.
 * Creates both user and profile records in a transaction.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { execute, queryOne } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, birthDate, fullName, username } = body;

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json(
        { error: 'Email, password e username sono obbligatori' },
        { status: 400 }
      );
    }

    // Format birth date for SQLite
    const dob = birthDate
      ? `${birthDate.year}-${String(birthDate.month).padStart(2, '0')}-${String(birthDate.day).padStart(2, '0')}`
      : '2000-01-01';

    // Hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    try {
      // Begin transaction (SQLite auto-commits by default, so we use explicit transaction)
      await execute('BEGIN TRANSACTION');

      // Check if email already exists
      const existingEmail = await queryOne(
        'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL',
        [email]
      );

      if (existingEmail) {
        await execute('ROLLBACK');
        return NextResponse.json(
          { error: 'Email già registrata' },
          { status: 409 }
        );
      }

      // Check if username already exists
      const existingUsername = await queryOne(
        'SELECT id FROM profiles WHERE username = ? AND deleted_at IS NULL',
        [username]
      );

      if (existingUsername) {
        await execute('ROLLBACK');
        return NextResponse.json(
          { error: 'Nome utente già esistente' },
          { status: 409 }
        );
      }

      // Insert user
      const userResult = await execute(
        `INSERT INTO users (email, password_hash, date_of_birth, is_email_verified)
         VALUES (?, ?, ?, 0)`,
        [email, hashedPassword, dob]
      );

      const userId = userResult.lastID;

      // Insert profile
      await execute(
        `INSERT INTO profiles (user_id, username, full_name)
         VALUES (?, ?, ?)`,
        [userId, username, fullName || '']
      );

      // Commit transaction
      await execute('COMMIT');

      return NextResponse.json(
        {
          message: 'Registrazione completata con successo',
          userId,
          username,
        },
        { status: 201 }
      );
    } catch (dbError: any) {
      // Rollback on error
      try {
        await execute('ROLLBACK');
      } catch (rollbackError) {
        console.error('[Register] Rollback error:', rollbackError);
      }

      console.error('[Register] Database error:', dbError);

      // Handle unique constraint violations
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

      throw dbError;
    }
  } catch (error) {
    console.error('[Register] Error:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
