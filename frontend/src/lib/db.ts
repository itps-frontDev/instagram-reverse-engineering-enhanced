import sqlite3 from "sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "instagram.db");

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

let db: sqlite3.Database | null = null;

function getDb(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) throw err;
      if (!IS_PRODUCTION) {
        console.log(`[DB] Connesso al database SQLite: ${DB_PATH}`);
      }
    });
    db.run("PRAGMA foreign_keys = ON");
    // Uso della modalità DELETE invece di WAL per maggiore persistenza dei dati in sviluppo
    // La modalità WAL può perdere dati se il server viene terminato bruscamente
    db.run("PRAGMA journal_mode = DELETE");
  }
  return db;
}

/**
 * @template T - Il tipo atteso per ogni riga nel set di risultati
 * @param sql - La query SQL con eventuali placeholder (?)
 * @param params - Array opzionale di valori da associare ai placeholder
 * @returns Una Promise che restituisce un array di righe corrispondenti alla query, tipizzate come T[]
 *
 * @example
 * // Ottieni tutti gli utenti attivi
 * const users = await queryAll<User>(
 *   'SELECT * FROM users WHERE deleted_at IS NULL'
 * );
 *
 * @example
 * // Ottieni utenti con un ruolo specifico
 * const admins = await queryAll<User>(
 *   'SELECT * FROM users WHERE role = ?',
 *   ['admin']
 * );
 */
export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const database = getDb();

    database.all(sql, params ?? [], (err, rows) => {
      if (err) {
        reject(err);
        return;
      }

      const duration = Date.now() - start;
      if (!IS_PRODUCTION) {
        console.log("[DB] Query eseguita", {
          sql: sql.length > 80 ? sql.substring(0, 80) + "..." : sql,
          duration: `${duration}ms`,
          rows: Array.isArray(rows) ? rows.length : 0,
        });
      }

      resolve(rows as T[]);
    });
  });
}

/**
 * Esegue una query SELECT e restituisce la prima riga corrispondente.
 *
 * @template T - Il tipo atteso della riga risultato
 * @param sql - La query SQL con eventuali placeholder (?)
 * @param params - Array opzionale di valori da associare ai placeholder
 * @returns Una Promise che restituisce la prima riga corrispondente tipizzata come T, o undefined se non trovata
 *
 * @example
 * // Ottieni utente per ID
 * const user = await queryOne<User>(
 *   'SELECT * FROM users WHERE id = ?',
 *   [userId]
 * );
 *
 * @example
 * // Ottieni utente per email (vincolo di unicità)
 * const user = await queryOne<User>(
 *   'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
 *   [email]
 * );
 */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const database = getDb();

    database.get(sql, params ?? [], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(row as T | undefined);
    });
  });
}

/**
 * Esegue una query INSERT, UPDATE o DELETE.
 *
 * @param sql - L'istruzione SQL con eventuali placeholder (?)
 * @param params - Array opzionale di valori da associare ai placeholder
 * @returns Una Promise che restituisce un oggetto contenente:
 *   - `lastID`: Il rowid dell'ultima riga inserita (per INSERT)
 *   - `changes`: Numero di righe interessate
 *
 * @example
 * // Inserisci un nuovo utente
 * const result = await execute(
 *   'INSERT INTO users (email, password_hash) VALUES (?, ?)',
 *   [email, passwordHash]
 * );
 * console.log('Nuovo ID utente:', result.lastID);
 *
 * @example
 * // Aggiorna un utente
 * const result = await execute(
 *   'UPDATE users SET email = ? WHERE id = ?',
 *   [newEmail, userId]
 * );
 * console.log('Righe aggiornate:', result.changes);
 *
 * @example
 * // Eliminazione soft di un utente
 * await execute(
 *   "UPDATE users SET deleted_at = datetime('now') WHERE id = ?",
 *   [userId]
 * );
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    const database = getDb();

    database.run(sql, params ?? [], function (err) {
      if (err) {
        reject(err);
        return;
      }

      // Il contesto 'this' contiene lastID e changes
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

/**
 * Esegue più istruzioni SQL contemporaneamente.
 *
 * Utile per eseguire migrazioni o script di inizializzazione.
 * Nota: Non supporta l'associazione di parametri.
 *
 * @param sql - Una stringa contenente una o più istruzioni SQL
 * @returns Una Promise che si risolve quando tutte le istruzioni sono eseguite
 * @throws Error se una qualsiasi istruzione fallisce l'esecuzione
 *
 * @example
 * // Esegui uno script di migrazione
 * const migrationSQL = await fs.readFile('migration.sql', 'utf-8');
 * await executeScript(migrationSQL);
 */
export async function executeScript(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();

    database.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

/**
 * Chiude la connessione al database.
 *
 * Dovrebbe essere chiamata quando l'applicazione si sta arrestando per garantire
 * che tutte le operazioni in sospeso siano completate e le risorse rilasciate.
 *
 * @returns Una Promise che si risolve quando la connessione è chiusa
 *
 * @example
 * // Nel gestore di arresto dell'app
 * process.on('SIGINT', async () => {
 *   await closeDb();
 *   process.exit(0);
 * });
 */
export async function closeDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
          return;
        }

        db = null;
        if (!IS_PRODUCTION) {
          console.log("[DB] Connessione chiusa");
        }

        resolve();
      });
    } else {
      resolve();
    }
  });
}


/**
 * Esegue una funzione all'interno di una transazione database.
 * 
 * Se la funzione completa con successo, la transazione viene committata.
 * Se la funzione lancia un'eccezione, la transazione viene annullata (rollback).
 * 
 * @template T - Tipo del valore di ritorno della funzione
 * @param fn - Funzione async da eseguire nella transazione
 * @returns Il valore restituito dalla funzione
 * @throws L'errore originale se la funzione fallisce (dopo il rollback)
 * 
 * @example
 * const result = await withTransaction(async () => {
 *   const userId = await userRepository.create({ email, password_hash });
 *   await profileRepository.create({ user_id: userId, username });
 *   return userId;
 * });
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  await execute('BEGIN TRANSACTION');
  
  try {
    const result = await fn();
    await execute('COMMIT');
    return result;
  } catch (error) {
    try {
      await execute('ROLLBACK');
    } catch (rollbackError) {
      console.error('[DB] Errore rollback:', rollbackError);
    }
    throw error;
  }
}

// ============================================================================
// ESPORTAZIONI
// ============================================================================

// Tutte le esportazioni sono ora basate su async/Promise.
export { getDb };
