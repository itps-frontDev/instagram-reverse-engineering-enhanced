/**
 * @fileoverview Tipi Comuni per Risposte API
 *
 * Tipi condivisi usati in molteplici endpoint API.
 * Standardizzare le risposte API migliora la consistenza e facilita
 * la gestione degli errori nel frontend.
 * 
 * @module types/api
 */

// ============================================================================
// TIPI PER ERRORI
// ============================================================================

/**
 * Risposta standard per errori API.
 * Tutte le API dovrebbero restituire questo formato in caso di errore.
 * 
 * @example
 * // 400 Bad Request
 * { error: "Email già in uso" }
 * 
 * // 500 Internal Server Error
 * { error: "Errore del server", details: "Connessione database fallita" }
 */
export interface ApiError {
  /** Messaggio di errore user-friendly */
  error: string;
  /** Dettagli tecnici (opzionale, utile per debug) */
  details?: string;
}

/**
 * Risposta standard per operazioni riuscite senza dati.
 * Usata per confermare azioni come DELETE, UPDATE senza body.
 * 
 * @example
 * // 200 OK dopo eliminazione
 * { message: "Post eliminato con successo" }
 */
export interface ApiSuccess {
  /** Messaggio di conferma */
  message: string;
}

// ============================================================================
// TIPI PER PAGINAZIONE
// ============================================================================

/**
 * Risposta paginata generica.
 * Usa i Generic di TypeScript (<T>) per essere riutilizzabile con qualsiasi tipo.
 * 
 * PAGINAZIONE CURSOR-BASED vs OFFSET-BASED:
 * - Offset: usa page number (es. ?page=2) - semplice ma problematico con dati che cambiano
 * - Cursor: usa un riferimento all'ultimo elemento - più robusto per feed in tempo reale
 * 
 * @typeParam T - Il tipo degli elementi nella lista (es. Post, Profile)
 * 
 * @example
 * // Risposta paginata di post
 * const response: PaginatedResponse<Post> = {
 *   data: [post1, post2, post3],
 *   nextCursor: "eyJpZCI6MTIzfQ==",  // base64 dell'ultimo ID
 *   hasMore: true,
 *   total: 150
 * };
 */
export interface PaginatedResponse<T> {
  /** Array di elementi per questa pagina */
  data: T[];
  /** Cursore per la prossima pagina (null se ultima pagina) */
  nextCursor: string | null;
  /** true se ci sono altre pagine */
  hasMore: boolean;
  /** Totale elementi (opzionale, costoso da calcolare) */
  total?: number;
}

/**
 * Parametri per richieste paginate.
 * Supporta sia paginazione offset che cursor.
 */
export interface PaginationParams {
  /** Numero di elementi per pagina */
  limit?: number;
  /** Offset per paginazione tradizionale */
  offset?: number;
  /** Cursor per paginazione cursor-based */
  cursor?: string;
}
