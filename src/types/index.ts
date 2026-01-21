/**
 * @fileoverview Export Centrale dei Tipi
 *
 * Ri-esporta tutti i tipi da un singolo punto d'ingresso per import più puliti.
 * Questo è un esempio del pattern "Barrel Export".
 * 
 * VANTAGGI:
 * 1. Import più corti e leggibili
 * 2. Nasconde la struttura interna delle cartelle
 * 3. Facile refactoring (puoi spostare file senza cambiare gli import)
 * 
 * @example
 * // PRIMA (senza barrel):
 * import { Profile } from '@/types/profile';
 * import { FeedPost } from '@/types/feed';
 * import { User } from '@/types/auth';
 *
 * // DOPO (con barrel):
 * import { Profile, FeedPost, User } from '@/types';
 */

// ============================================================================
// EXPORT DEI TIPI PER DOMINIO
// ============================================================================

// Tipi relativi ai profili utente (Profile, FollowRelationship, etc.)
export * from './profile';

// Tipi relativi al feed e ai post (FeedPost, PostMedia, Comment, etc.)
export * from './feed';

// Tipi relativi all'autenticazione (User, TokenPayload, etc.)
export * from './auth';

// Tipi relativi alle risposte API (ApiError, ApiSuccess, etc.)
export * from './api';
