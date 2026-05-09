/**
 * @fileoverview Configurazione Centralizzata
 * 
 * Tutti i valori di configurazione dell'applicazione in un unico posto.
 * Utilizza variabili d'ambiente con valori predefiniti sensati.
 * 
 * VANTAGGI DI UNA CONFIGURAZIONE CENTRALIZZATA:
 * 1. Single Source of Truth - Un unico punto dove modificare le impostazioni
 * 2. Type Safety - TypeScript garantisce che i valori siano del tipo corretto
 * 3. Validazione - Controllo immediato di variabili mancanti all'avvio
 * 4. Documentazione - Tutti i parametri configurabili sono visibili in un file
 * 
 * @module lib/config
 * 
 * @example
 * import { config } from '@/lib/config';
 * 
 * // Accesso alla configurazione JWT
 * const token = await signJwt(payload, config.jwt.secret, config.jwt.expiresIn);
 * 
 * // Accesso alla configurazione storage
 * const uploadPath = path.join(config.storage.uploadDir, 'posts');
 */

// ============================================================================
// HELPER PER LE VARIABILI D'AMBIENTE
// ============================================================================

/**
 * Recupera una variabile d'ambiente stringa.
 * Se non esiste e non c'è un default, lancia un errore.
 * 
 * @param key - Nome della variabile d'ambiente
 * @param defaultValue - Valore predefinito se la variabile non esiste
 * @returns Il valore della variabile o il default
 * @throws Error se la variabile non esiste e non c'è default
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) return defaultValue;
    throw new Error(`Variabile d'ambiente mancante: ${key}`);
  }
  return value;
}

/**
 * Recupera una variabile d'ambiente e la converte in numero.
 * Se il parsing fallisce, usa il valore predefinito.
 * 
 * @param key - Nome della variabile d'ambiente
 * @param defaultValue - Valore numerico predefinito
 * @returns Il valore numerico della variabile o il default
 */
function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    console.warn(`Numero non valido per ${key}, uso il default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

/**
 * Recupera una variabile d'ambiente e la converte in booleano.
 * Accetta 'true' o '1' come valori truthy.
 * 
 * @param key - Nome della variabile d'ambiente
 * @param defaultValue - Valore booleano predefinito
 * @returns true se la variabile è 'true' o '1', altrimenti false o il default
 */
function getEnvBoolean(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

// ============================================================================
// OGGETTO DI CONFIGURAZIONE PRINCIPALE
// ============================================================================

/**
 * Oggetto di configurazione principale dell'applicazione.
 * Usa `as const` per rendere tutti i valori readonly e permettere
 * a TypeScript di inferire i tipi letterali.
 */
export const config = {
  /**
   * Configurazione ambiente di esecuzione.
   * Utile per abilitare/disabilitare funzionalità in base all'ambiente.
   */
  env: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    nodeEnv: getEnv('NODE_ENV', 'development'),
  },

  /**
   * Configurazione del server.
   * Questi valori definiscono come il server Next.js viene eseguito.
   */
  server: {
    /** Porta su cui il server ascolta (default: 3000) */
    port: getEnvNumber('PORT', 3000),
    /** Host del server (default: localhost) */
    host: getEnv('HOST', 'localhost'),
    /** URL base pubblico dell'applicazione */
    baseUrl: getEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000'),
  },

  /**
   * Configurazione del database SQLite.
   * SQLite è un database file-based, ideale per sviluppo e piccole applicazioni.
   */
  database: {
    /** Percorso del file database SQLite */
    path: getEnv('DATABASE_PATH', './data/instagram.db'),
    /** Abilita il logging delle query (utile per debug) */
    logging: getEnvBoolean('DB_LOGGING', false),
  },

  /**
   * Configurazione autenticazione.
   * La sessione viene gestita tramite cookie server-side.
   */
  auth: {
    cookieName: 'iree_session',
  },

  /**
   * Configurazione storage per upload file.
   * Gestisce dove e come vengono salvati i file caricati dagli utenti.
   */
  storage: {
    /** Directory base per i file caricati */
    uploadDir: getEnv('UPLOAD_DIR', './data/uploads'),
    /** Percorso URL pubblico per servire i file */
    publicPath: '/uploads',
    /** Dimensione massima file in bytes (default: 10MB = 10 * 1024 * 1024) */
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', 10 * 1024 * 1024),
    /** Tipi MIME immagine permessi (per validazione upload) */
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    /** Tipi MIME video permessi */
    allowedVideoTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
  },

  /**
   * Configurazione paginazione.
   * La paginazione è essenziale per non caricare troppi dati in una volta.
   * Offset-based: usa LIMIT e OFFSET nelle query SQL.
   */
  pagination: {
    /** Numero elementi per pagina di default */
    defaultLimit: 20,
    /** Numero massimo elementi richiedibili (protezione performance) */
    maxLimit: 100,
    /** Offset di partenza (0 = prima pagina) */
    defaultOffset: 0,
  },

  /**
   * Rate Limiting per le API.
   * Limita il numero di richieste per prevenire abusi e attacchi DDoS.
   * Esempio: max 100 richieste ogni 15 minuti per IP.
   */
  rateLimit: {
    /** Numero massimo di richieste per finestra temporale */
    maxRequests: getEnvNumber('RATE_LIMIT_MAX', 100),
    /** Durata finestra in millisecondi (default: 15 min = 900000ms) */
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  },

  /**
   * Feature Flags (Toggle delle funzionalità).
   * Permettono di abilitare/disabilitare funzionalità senza deploy.
   * Utili per: rilasci graduali, A/B testing, disabilitare feature problematiche.
   */
  features: {
    /** Abilita la funzionalità Storie */
    storiesEnabled: getEnvBoolean('FEATURE_STORIES', true),
    /** Abilita i messaggi diretti (DM) */
    directMessagesEnabled: getEnvBoolean('FEATURE_DM', true),
    /** Abilita i Reels (video brevi) */
    reelsEnabled: getEnvBoolean('FEATURE_REELS', true),
    /** Abilita la pagina Esplora */
    exploreEnabled: getEnvBoolean('FEATURE_EXPLORE', true),
  },

  /**
   * Impostazioni profilo utente.
   * Definisce i limiti e le regole per i dati del profilo.
   */
  profile: {
    /** Lunghezza massima biografia (come Instagram: 150 caratteri) */
    maxBioLength: 150,
    /** Lunghezza massima username */
    maxUsernameLength: 30,
    /** Lunghezza minima username */
    minUsernameLength: 3,
    /** Pattern regex per username: solo lettere, numeri, punti e underscore */
    usernamePattern: /^[a-zA-Z0-9._]+$/,
    /** Immagine profilo di default per nuovi utenti */
    defaultProfileImage: '/images/default-avatar.png',
  },

  /**
   * Impostazioni post.
   * Limiti per i contenuti pubblicati dagli utenti.
   */
  post: {
    /** Lunghezza massima didascalia (caption) */
    maxCaptionLength: 2200,
    /** Numero massimo immagini per post (carousel) */
    maxImagesPerPost: 10,
    /** Numero massimo hashtag per post */
    maxHashtagsPerPost: 30,
    /** Numero massimo menzioni (@utente) per post */
    maxMentionsPerPost: 20,
  },

  /**
   * Impostazioni commenti.
   */
  comment: {
    /** Lunghezza massima commento */
    maxCommentLength: 2200,
    /** Profondità massima risposte annidate (1 = solo risposte dirette) */
    maxReplyDepth: 1,
  },
} as const; // 'as const' rende l'oggetto immutabile e i tipi literal

// ============================================================================
// EXPORT DEI TIPI
// ============================================================================

/**
 * Tipi derivati dalla configurazione.
 * Usando `typeof config` TypeScript inferisce automaticamente i tipi.
 * Questo è un pattern comune per avere type safety senza duplicare definizioni.
 */
export type Config = typeof config;
export type JwtConfig = typeof config.jwt;
export type StorageConfig = typeof config.storage;
export type PaginationConfig = typeof config.pagination;

// Export default per import più semplice: import config from '@/lib/config'
export default config;
