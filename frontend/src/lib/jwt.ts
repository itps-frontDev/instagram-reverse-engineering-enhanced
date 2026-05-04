/**
 * @fileoverview Utilità per token JWT
 *
 * Gestisce la generazione, verifica e decodifica di token JWT per l'autenticazione.
 *
 * @module lib/jwt
 */

import { SignJWT, jwtVerify, decodeJwt } from 'jose';

// ============================================================================
// COSTANTI
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// jose richiede una chiave Uint8Array
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET);

// ============================================================================
// TIPI
// ============================================================================

/**
 * Payload del token JWT
 */
export interface TokenPayload {
  id: number;
  email: string | null;
  username: string | null;
  iat?: number;
  exp?: number;
}

// ============================================================================
// FUNZIONI
// ============================================================================

/**
 * Genera un token JWT per un utente.
 *
 * @param payload - Dati utente da codificare nel token
 * @returns La stringa del token JWT firmato
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
 * Verifica e decodifica un token JWT.
 *
 * @param token - La stringa del token JWT da verificare
 * @returns Il payload del token decodificato o null se non valido
 *
 * @example
 * const payload = verifyToken(token);
 * if (payload) {
 *   console.log('ID Utente:', payload.id);
 * } else {
 *   console.log('Token non valido');
 * }
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as TokenPayload;
  } catch (error) {
    console.error('[JWT] Verifica token fallita:', error);
    return null;
  }
}

/**
 * Decodifica un token JWT senza verificare la firma.
 * Utile per ispezionare token scaduti o per debug.
 *
 * @param token - La stringa del token JWT da decodificare
 * @returns Il payload del token decodificato o null se malformato
 *
 * @example
 * const payload = decodeToken(token);
 * if (payload) {
 *   console.log('Token scade il:', new Date(payload.exp! * 1000));
 * }
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = decodeJwt(token) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('[JWT] Decodifica token fallita:', error);
    return null;
  }
}

/**
 * Verifica se un token JWT è scaduto.
 *
 * @param token - La stringa del token JWT da controllare
 * @returns true se il token è scaduto, false altrimenti
 *
 * @example
 * if (isTokenExpired(token)) {
 *   console.log('Per favore effettua nuovamente il login');
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
