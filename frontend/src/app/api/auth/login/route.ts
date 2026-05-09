import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/repositories';
import { generateToken } from '@/lib/jwt';
import { attemptLogin, parseLoginInput } from '@/lib/auth-login';

export const runtime = 'nodejs';

const TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const loginInput = parseLoginInput(body);
    const loginResult = await attemptLogin(loginInput, {
      findByCredentials: userRepository.findByCredentials,
      comparePassword: bcrypt.compare,
      updateLastLogin: userRepository.updateLastLogin,
    });

    if (!loginResult.ok) {
      return NextResponse.json(
        { error: loginResult.error },
        { status: loginResult.status }
      );
    }

    const token = await generateToken({
      id: loginResult.user.id,
      email: loginResult.user.email,
      username: loginResult.user.username,
    });

    const response = NextResponse.json(
      {
        message: 'Login effettuato con successo',
        user: {
          id: loginResult.user.id,
          email: loginResult.user.email,
          username: loginResult.user.username,
          fullName: loginResult.user.full_name,
        },
        redirectTo: loginResult.redirectTo,
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: TOKEN_MAX_AGE_SECONDS,
    };

    response.cookies.set('iree_access_token', token, cookieOptions);
    response.cookies.set('authToken', token, cookieOptions);

    return response;
  } catch (error) {
    console.error('[Login] Errore:', error);
    return NextResponse.json(
      { error: 'Errore del server' },
      { status: 500 }
    );
  }
}
