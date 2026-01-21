/**
 * @fileoverview API per Recupero Notifiche Utente
 *
 * Restituisce tutte le notifiche per l'utente autenticato.
 * Include informazioni sul mittente e anteprima del post se presente.
 * 
 * NOTA: Questa API ha una struttura legacy con campi diversi dal repository standard.
 * Mantenuta per compatibilità con il frontend esistente.
 * Usa il metodo getByProfileIdLegacy del NotificationRepository.
 *
 * PATTERN REPOSITORY:
 * Usa NotificationRepository per accesso centralizzato ai dati.
 *
 * @module api/notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// GET /api/notifications
// ============================================================================

/**
 * Ottiene le notifiche per l'utente autenticato.
 * 
 * Usa il formato legacy per compatibilità con il frontend.
 *
 * @param request - Oggetto richiesta Next.js
 * @returns Lista notifiche o errore
 */
export async function GET(request: NextRequest) {
  try {
    // Ottieni profilo utente corrente
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Recupera notifiche in formato legacy usando il repository
    const notifications = await notificationRepository.getByProfileIdLegacy(
      currentProfile.id,
      50
    );

    return NextResponse.json(
      { notifications },
      { status: 200 }
    );
  } catch (error) {
    console.error('Errore nel recupero notifiche:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle notifiche', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
