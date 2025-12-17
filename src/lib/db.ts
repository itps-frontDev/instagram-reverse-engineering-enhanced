import { Pool, QueryResult, QueryResultRow } from "pg";

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test della connessione
pool.on("connect", () => {
  console.log("Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

/**
 * Esegue una query SQL
 * @param text - Query SQL
 * @param params - Parametri della query (opzionale)
 * @returns Risultato della query
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  console.log("Executed query", { text, duration, rows: result.rowCount });
  return result;
}

/**
 * Ottiene un client dal pool per transazioni
 */
export async function getClient() {
  const client = await pool.connect();
  return client;
}

/**
 * Esegue una transazione
 * @param callback - Funzione da eseguire nella transazione
 */
export async function transaction<T>(
  callback: (client: ReturnType<typeof pool.connect> extends Promise<infer C> ? C : never) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
