/**
 * @fileoverview API per Conteggio Notifiche Non Lette
 *
 * Restituisce il numero di notifiche non lette per l'utente autenticato.
 * Usato per mostrare il badge nel menu di navigazione.
 * 
 * OTTIMIZZAZIONE:
 * Questa API viene chiamata frequentemente (polling o su navigazione).
 * Usa una query COUNT(*) veloce invece di caricare tutte le notifiche.
 *
 * @module api/notifications/unread-count
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationRepository } from '@/repositories';
import { getCurrentProfile } from '@/lib/auth';

// ============================================================================
// GET /api/notifications/unread-count
// ============================================================================

/**
 * Ottiene il conteggio delle notifiche non lette.
 *
 * @param request - Oggetto richiesta Next.js
 * @returns { count: number } o errore
 */
export async function GET(request: NextRequest) {
  try {
    // Ottieni profilo utente corrente dal token JWT
    const currentProfile = await getCurrentProfile();

    if (!currentProfile) {
      return NextResponse.json(
        { error: 'Non autorizzato' },
        { status: 401 }
      );
    }

    // Usa il repository per ottenere il conteggio
    const count = await notificationRepository.getUnreadCount(currentProfile.id);

    return NextResponse.json(
      { count },
      { status: 200 }
    );
  } catch (error) {
    console.error('Errore nel recupero conteggio notifiche:', error);
    return NextResponse.json(
      { error: 'Errore nel recupero delle notifiche' },
      { status: 500 }
    );
  }
}
