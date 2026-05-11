/**
 * @fileoverview Definizioni di Tipo per Autenticazione
 *
 * Tipi per utenti, autenticazione e token JWT.
 * Questi tipi definiscono la struttura dei dati relativi all'identità dell'utente.
 * 
 * NOTA SU TYPESCRIPT INTERFACES:
 * Le interface definiscono la "forma" (shape) di un oggetto.
 * TypeScript verifica a compile-time che gli oggetti rispettino questa forma.
 * 
 * @module types/auth
 */

// ============================================================================
// TIPI UTENTE
// ============================================================================

/**
 * Informazioni base dell'utente dalla tabella users.
 * Contiene solo i dati identificativi, non il profilo.
 * 
 * NOTA: email e phone_number sono nullable perché
 * l'utente può registrarsi con uno dei due.
 */
export interface User {
  /** ID univoco dell'utente (chiave primaria) */
  id: string | number;
  /** Email dell'utente (può essere null se registrato con telefono) */
  email: string | null;
  /** Numero di telefono (può essere null se registrato con email) */
  phone_number: string | null;
}

/**
 * Utente con hash della password.
 * Usato SOLO durante il processo di login per verificare la password.
 * MAI restituire questo tipo nelle risposte API!
 * 
 * EXTENDS: eredita tutte le proprietà di User e aggiunge password_hash
 */
export interface UserWithPassword extends User {
  /** Hash della password (MAI la password in chiaro!) */
  password_hash: string;
}

/**
 * Utente con informazioni del profilo.
 * Usato nelle risposte dopo login riuscito.
 */
export interface UserWithProfile extends User {
  /** Username del profilo (può essere null se non ha ancora profilo) */
  username: string | null;
  /** Nome completo del profilo */
  full_name: string | null;
}

// ============================================================================
// TIPI JWT (JSON Web Token)
// ============================================================================

/**
 * Payload del token JWT.
 * Questi dati vengono codificati nel token e sono leggibili
 * (ma non modificabili senza invalidare la firma).
 * 
 * STRUTTURA JWT: header.payload.signature
 * - header: algoritmo usato (es. HS256)
 * - payload: questi dati (claims)
 * - signature: firma per verificare integrità
 * 
 * CLAIMS STANDARD:
 * - iat (issued at): quando è stato creato il token
 * - exp (expiration): quando scade il token
 */
export interface TokenPayload {
  /** ID dell'utente - claim personalizzato */
  id: string | number;
  /** Email dell'utente - claim personalizzato */
  email: string | null;
  /** Username dell'utente - claim personalizzato */
  username: string | null;
  /** Timestamp di creazione (automatico) */
  iat?: number;
  /** Timestamp di scadenza (automatico) */
  exp?: number;
}

// ============================================================================
// TIPI RICHIESTE/RISPOSTE API
// ============================================================================

/**
 * Body della richiesta di login.
 * Il campo 'email' può contenere email, telefono, o username.
 */
export interface LoginRequest {
  /** Identificatore: può essere email, telefono, o username */
  identifier: string;
  /** @deprecated Compatibilità con vecchi client/test che inviano il campo email */
  email?: string;
  /** Password in chiaro (verrà verificata contro l'hash) */
  password: string;
  /** URL di redirect dopo login (opzionale) */
  redirect?: string;
}

/**
 * Risposta dopo login riuscito.
 * Include i dati utente da mostrare nell'UI.
 */
export interface LoginResponse {
  /** Messaggio di conferma */
  message: string;
  /** Dati utente per l'UI */
  user: {
    id: string | number;
    email: string | null;
    username: string | null;
    fullName: string | null;
  };
  /** URL dove reindirizzare l'utente */
  redirectTo: string;
  /** Token di accesso rilasciato da Spring */
  accessToken: string;
  /** Durata token in secondi */
  expiresIn: number;
  /** Tipo token (es. Bearer) */
  tokenType?: string;
}

/**
 * Body della richiesta di registrazione.
 * Almeno email O phone deve essere fornito.
 */
export interface RegisterRequest {
  /** Email (opzionale se c'è phone) */
  email?: string;
  /** Telefono (opzionale se c'è email) */
  phone?: string;
  /** Nome completo */
  fullName: string;
  /** Username desiderato (deve essere unico) */
  username: string;
  /** Password (verrà hashata prima del salvataggio) */
  password: string;
  /** Data di nascita in formato ISO (YYYY-MM-DD) */
  dateOfBirth: string;
}

/**
 * Risposta endpoint /api/auth/me
 * Restituisce il profilo dell'utente autenticato.
 */
export interface MeResponse {
  /** Profilo completo dell'utente */
  profile: import('./profile').Profile;
}
