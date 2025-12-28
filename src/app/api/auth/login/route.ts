/**
 * @fileoverview Login API endpoint
 *
 * Handles user authentication with email/phone/username and password.
 * Returns a JWT token in an HTTP-only cookie upon successful login.
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryOne } from '@/lib/db';
import { generateToken } from '@/lib/jwt';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export const runtime = 'nodejs';

interface User {
  id: number;
  email: string | null;
  phone_number: string | null;
  password_hash: string;
  username: string | null;
  full_name: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email: identifier, password, redirect } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Inserisci le credenziali complete' },
        { status: 400 }
      );
    }

    // Query to find user by email, phone, or username
    const user = await queryOne<User>(
      `SELECT
        u.id,
        u.email,
        u.phone_number,
        u.password_hash,
        p.username,
        p.full_name
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE (u.email = ? OR u.phone_number = ? OR p.username = ?)
        AND u.deleted_at IS NULL
      LIMIT 1`,
      [identifier, identifier, identifier]
    );

    // Verify user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
    });

    // Prepare response - just return success without redirecting
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

    // Set HTTP-only cookie
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // ...log rimossi...

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Si è verificato un errore durante l'accesso" },
      { status: 500 }
    );
  }
}
