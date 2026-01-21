/**
 * @fileoverview API per segnare le notifiche come lette
 *
 * Questo endpoint segna tutte le notifiche come lette per l'utente autenticato.
 *
 * REFACTORING: Usa NotificationRepository invece di query dirette.
 * 
 * @module api/notifications/mark-read
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// PATCH /api/notifications/mark-read
// ============================================================================

/**
 * Segna tutte le notifiche come lette per l'utente autenticato.
 *
 * Richiede autenticazione via cookie HTTP-only.
 *
 * @param request - Oggetto request Next.js
 * @returns Risposta di successo o errore
 */
export async function PATCH(request: NextRequest) {
  try {
    // -------------------------------------------------------------------------
    // Autenticazione: ottiene il profilo corrente dal token JWT
    // -------------------------------------------------------------------------
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // -------------------------------------------------------------------------
    // Segna tutte le notifiche come lette usando il repository
    // -------------------------------------------------------------------------
    await notificationRepository.markAllAsRead(currentProfile.id);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Errore nel segnare le notifiche come lette:', error);
    return NextResponse.json(
      { error: 'Errore nel segnare le notifiche come lette' },
      { status: 500 }
    );
  }
}
