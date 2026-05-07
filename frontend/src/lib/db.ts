/**
 * @fileoverview Database Connection Layer (PostgreSQL)
 *
 * Gestisce la connessione al database PostgreSQL tramite `pg` (node-postgres).
 * Fornisce un'API semplificata per eseguire query, con supporto per transazioni.
 *
 * PATTERN UTILIZZATI:
 * 1. Connection Pool: riutilizza connessioni invece di aprirne una nuova per ogni query
 * 2. AsyncLocalStorage: propaga il client di transazione nei metodi annidati
 *    senza dover cambiare le firme di queryAll/queryOne/execute
 * 3. Positional Parameters: converte `?` in `$1, $2, ...` per compatibilità PostgreSQL
 *    (evita di riscrivere tutte le query nei repository)
 *
 * UTILIZZO:
 * - queryAll<T>(sql, params): restituisce array di righe
 * - queryOne<T>(sql, params): restituisce prima riga o undefined
 * - execute(sql, params): per INSERT/UPDATE/DELETE, restituisce { lastID, changes }
 * - withTransaction(fn): esegue fn() in una transazione ACID
 *
 * @module lib/db
 */

import { Pool, PoolClient, QueryResultRow } from 'pg';
import { AsyncLocalStorage } from 'async_hooks';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Propaga il client di transazione nei metodi annidati senza cambiare le firme.
 * Se `getRunner()` trova un client in storage, lo usa al posto del pool globale,
 * garantendo che tutte le query dello stesso contesto usino la stessa connessione.
 */
const txStorage = new AsyncLocalStorage<PoolClient>();

/**
 * Converte i placeholder `?` stile SQLite in `$1, $2, ...` stile PostgreSQL.
 * Permette di mantenere la sintassi `?` in tutti i repository.
 *
 * @param sql - Query SQL con placeholder `?`
 * @returns Query SQL con placeholder PostgreSQL `$N`
 */
function toPositional(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

/**
 * Restituisce il runner corretto: il client di transazione se siamo dentro
 * una withTransaction(), altrimenti il pool globale.
 */
function getRunner(): Pool | PoolClient {
  return txStorage.getStore() ?? pool;
}

/**
 * Esegue una query e restituisce tutte le righe.
 * In sviluppo stampa la query e il tempo di esecuzione.
 *
 * @param sql - Query SQL (con `?` come placeholder)
 * @param params - Parametri da iniettare in ordine
 * @returns Array di righe tipizzate come T
 *
 * @example
 * const posts = await queryAll<Post>('SELECT * FROM posts WHERE profile_id = ?', [profileId]);
 */
export async function queryAll<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const start = Date.now();
  const runner = getRunner();
  const result = await runner.query<T>(toPositional(sql), params ?? []);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Query eseguita', {
      sql: sql.length > 80 ? sql.substring(0, 80) + '...' : sql,
      duration: `${Date.now() - start}ms`,
      rows: result.rowCount,
    });
  }
  return result.rows;
}

/**
 * Esegue una query e restituisce solo la prima riga.
 * Utile per ricerche per ID o unicità (email, username, ecc.).
 *
 * @param sql - Query SQL (con `?` come placeholder)
 * @param params - Parametri da iniettare in ordine
 * @returns Prima riga tipizzata come T, oppure undefined se nessun risultato
 *
 * @example
 * const user = await queryOne<User>('SELECT * FROM users WHERE id = ?', [id]);
 */
export async function queryOne<T extends QueryResultRow = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | undefined> {
  const runner = getRunner();
  const result = await runner.query<T>(toPositional(sql), params ?? []);
  return result.rows[0];
}

/**
 * Esegue una query di scrittura (INSERT, UPDATE, DELETE).
 *
 * - Per INSERT con `RETURNING id`: `lastID` conterrà l'ID generato
 * - Per UPDATE/DELETE: `changes` conterrà il numero di righe modificate
 *
 * NOTA: Gli INSERT che necessitano dell'ID generato devono includere `RETURNING id`
 * nella query. PostgreSQL non ha un equivalente di `lastInsertRowId` di SQLite.
 *
 * @param sql - Query SQL (con `?` come placeholder)
 * @param params - Parametri da iniettare in ordine
 * @returns { lastID: number, changes: number }
 *
 * @example
 * const { lastID } = await execute('INSERT INTO posts (...) VALUES (?) RETURNING id', [...]);
 * const { changes } = await execute('UPDATE posts SET ... WHERE id = ?', [...]);
 */
export async function execute(
  sql: string,
  params?: unknown[]
): Promise<{ lastID: number; changes: number }> {
  const runner = getRunner();
  const result = await runner.query(toPositional(sql), params ?? []);
  return {
    lastID: (result.rows[0]?.id as number) ?? 0,
    changes: result.rowCount ?? 0,
  };
}

/**
 * Esegue uno script SQL multi-statement (es. durante migrazione o seeding).
 * Acquisisce un client dedicato e lo rilascia al termine.
 *
 * @param sql - Script SQL con più statement separati da `;`
 */
export async function executeScript(sql: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
}

/**
 * Esegue una funzione all'interno di una transazione ACID.
 *
 * COME FUNZIONA:
 * 1. Acquisisce un `PoolClient` dedicato
 * 2. Invia `BEGIN`
 * 3. Memorizza il client in `txStorage` (AsyncLocalStorage)
 * 4. Esegue `fn()` — tutte le chiamate a queryAll/queryOne/execute
 *    al suo interno troveranno automaticamente il client in storage
 * 5. Se `fn()` ha successo → `COMMIT`, altrimenti → `ROLLBACK`
 * 6. Rilascia il client al pool
 *
 * @param fn - Funzione da eseguire nella transazione
 * @returns Il valore restituito da fn()
 * @throws Rilancia l'errore dopo il ROLLBACK
 *
 * @example
 * await withTransaction(async () => {
 *   const postId = await postRepository.create(data);
 *   await postRepository.addMedia({ post_id: postId, ... });
 *   await profileRepository.incrementPostsCount(profileId);
 * });
 */
export async function withTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await txStorage.run(client, fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('[DB] Errore rollback:', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Chiude il pool di connessioni.
 * Chiamare al termine del processo (es. durante il graceful shutdown).
 */
export async function closeDb(): Promise<void> {
  await pool.end();
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Connessione chiusa');
  }
}

/**
 * Restituisce il pool di connessioni grezzo.
 * Usare solo quando serve accesso diretto a `pg.Pool`
 * (es. per stream o operazioni COPY).
 */
export function getDb() {
  return pool;
}
