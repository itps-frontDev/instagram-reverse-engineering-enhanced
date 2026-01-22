/**
 * @fileoverview Utility per la formattazione delle date.
 * 
 * Fornisce funzioni per formattare date e tempi relativi
 * in formato leggibile e localizzato in italiano.
 * 
 * @module lib/date-utils
 */

/**
 * Formatta una data in formato "tempo fa" relativo.
 * 
 * Converte una stringa data ISO in un formato leggibile che indica
 * quanto tempo è passato (es. "5m", "2h", "3g", "1set").
 * 
 * LOGICA DI FORMATTAZIONE:
 * - < 1 minuto: "Ora"
 * - < 60 minuti: "{n}m" (minuti)
 * - < 24 ore: "{n}h" (ore)
 * - < 7 giorni: "{n}g" (giorni)
 * - < 4 settimane: "{n}set" (settimane)
 * - >= 4 settimane: data formattata (es. "15 gen")
 * 
 * @param dateString - Stringa data in formato ISO (es. "2024-01-15T10:30:00Z")
 * @returns Stringa formattata con tempo relativo in italiano
 * 
 * @example
 * // 5 minuti fa
 * formatTimeAgo("2024-01-15T10:25:00Z") // "5m"
 * 
 * @example
 * // 2 ore fa
 * formatTimeAgo("2024-01-15T08:30:00Z") // "2h"
 * 
 * @example
 * // 3 giorni fa
 * formatTimeAgo("2024-01-12T10:30:00Z") // "3g"
 */
export function formatTimeAgo(dateString: string): string {
  // Parsing della data ISO
  const date = new Date(dateString);
  const now = new Date();
  
  // Calcolo differenza in millisecondi
  const diffMs = now.getTime() - date.getTime();
  
  // Conversione in unità di tempo
  const diffMins = Math.floor(diffMs / 60000);      // 60 * 1000
  const diffHours = Math.floor(diffMins / 60);       // minuti / 60
  const diffDays = Math.floor(diffHours / 24);       // ore / 24
  const diffWeeks = Math.floor(diffDays / 7);        // giorni / 7

  // Formattazione in base all'intervallo temporale
  if (diffMins < 1) return 'Ora';                    // Meno di 1 minuto
  if (diffMins < 60) return `${diffMins}m`;          // Minuti (1-59)
  if (diffHours < 24) return `${diffHours}h`;        // Ore (1-23)
  if (diffDays < 7) return `${diffDays}g`;           // Giorni (1-6)
  if (diffWeeks < 4) return `${diffWeeks}set`;       // Settimane (1-3)
  
  // Per date più vecchie, mostra giorno e mese abbreviato
  return date.toLocaleDateString('it-IT', { 
    day: 'numeric', 
    month: 'short' 
  });
}

/**
 * Formatta una data in formato esteso italiano.
 * 
 * @param dateString - Stringa data in formato ISO
 * @returns Data formattata (es. "15 gennaio 2024")
 * 
 * @example
 * formatDateLong("2024-01-15T10:30:00Z") // "15 gennaio 2024"
 */
export function formatDateLong(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Formatta una data in formato breve italiano.
 * 
 * @param dateString - Stringa data in formato ISO
 * @returns Data formattata (es. "15 gen 2024")
 * 
 * @example
 * formatDateShort("2024-01-15T10:30:00Z") // "15 gen 2024"
 */
export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formatta un orario in formato HH:MM.
 * 
 * @param dateString - Stringa data in formato ISO
 * @returns Orario formattato (es. "10:30")
 * 
 * @example
 * formatTime("2024-01-15T10:30:00Z") // "10:30"
 */
export function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('it-IT', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
