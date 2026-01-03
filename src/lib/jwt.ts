/**
 * @fileoverview JWT token utilities
 *
 * Handles JWT token generation, verification, and decoding for authentication.
 *
 * @module lib/jwt
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// ============================================================================
// CONSTANTS
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// jose richiede una chiave Uint8Array
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

// ============================================================================
// TYPES
// ============================================================================

/**
 * JWT token payload
 */
export interface TokenPayload {
  id: number;
  email: string | null;
  username: string | null;
  iat?: number;
  exp?: number;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Generate a JWT token for a user.
 *
 * @param payload - User data to encode in the token
 * @returns The signed JWT token string
 *
 * @example
 * const token = generateToken({
 *   id: 1,
 *   email: 'john@example.com',
 *   username: 'johndoe'
 * });
 */
export async function generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  let exp: number;
  if (typeof JWT_EXPIRES_IN === 'string' && JWT_EXPIRES_IN.endsWith('d')) {
    const days = parseInt(JWT_EXPIRES_IN.replace('d', ''));
    exp = iat + days * 24 * 60 * 60;
  } else if (!isNaN(Number(JWT_EXPIRES_IN))) {
    exp = iat + Number(JWT_EXPIRES_IN);
  } else {
    exp = iat + 7 * 24 * 60 * 60; // default 7d
  }
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

/**
 * Verify and decode a JWT token.
 *
 * @param token - The JWT token string to verify
 * @returns The decoded token payload or null if invalid
 *
 * @example
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log('User ID:', payload.id);
 * } else {
 *   console.log('Invalid token');
 * }
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
}

/**
 * Decode a JWT token without verifying the signature.
 * Useful for inspecting expired tokens or debugging.
 *
 * @param token - The JWT token string to decode
 * @returns The decoded token payload or null if malformed
 *
 * @example
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token expires at:', new Date(payload.exp! * 1000));
 * }
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = decodeJwt(token) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Token decoding failed:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired.
 *
 * @param token - The JWT token string to check
 * @returns true if the token is expired, false otherwise
 *
 * @example
 * if (isTokenExpired(token)) {
 *   console.log('Please login again');
 * }
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}
