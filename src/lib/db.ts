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
        console.log(`[DB] Connected to SQLite database: ${DB_PATH}`);
      }
    });
    db.run("PRAGMA foreign_keys = ON");
    db.run("PRAGMA journal_mode = WAL");
  }
  return db;
}

/**
 * @template T - The expected type of each row in the result set
 * @param sql - The SQL query string with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns A Promise resolving to an array of rows matching the query, typed as T[]
 *
 * @example
 * // Get all active users
 * const users = await queryAll<User>(
 *   'SELECT * FROM users WHERE deleted_at IS NULL'
 * );
 *
 * @example
 * // Get users with specific role
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
        console.log("[DB] Query executed", {
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
 * Executes a SELECT query and returns the first matching row.
 *
 * @template T - The expected type of the result row
 * @param sql - The SQL query string with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns A Promise resolving to the first matching row typed as T, or undefined if no match
 *
 * @example
 * // Get user by ID
 * const user = await queryOne<User>(
 *   'SELECT * FROM users WHERE id = ?',
 *   [userId]
 * );
 *
 * @example
 * // Get user by email (unique constraint)
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
 * Executes an INSERT, UPDATE, or DELETE query.
 *
 * @param sql - The SQL statement with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns A Promise resolving to an object containing:
 *   - `lastID`: The rowid of the last inserted row (for INSERT)
 *   - `changes`: Number of rows affected
 *
 * @example
 * // Insert a new user
 * const result = await execute(
 *   'INSERT INTO users (email, password_hash) VALUES (?, ?)',
 *   [email, passwordHash]
 * );
 * console.log('New user ID:', result.lastID);
 *
 * @example
 * // Update a user
 * const result = await execute(
 *   'UPDATE users SET email = ? WHERE id = ?',
 *   [newEmail, userId]
 * );
 * console.log('Rows updated:', result.changes);
 *
 * @example
 * // Soft delete a user
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

      // 'this' context contains lastID and changes
      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

/**
 * Executes multiple SQL statements at once.
 *
 * Useful for running migrations or initialization scripts.
 * Note: This does not support parameter binding.
 *
 * @param sql - A string containing one or more SQL statements
 * @returns A Promise that resolves when all statements are executed
 * @throws Error if any statement fails to execute
 *
 * @example
 * // Run a migration script
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
 * Closes the database connection.
 *
 * Should be called when the application is shutting down to ensure
 * all pending operations are completed and resources are released.
 *
 * @returns A Promise that resolves when the connection is closed
 *
 * @example
 * // In your app shutdown handler
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
          console.log("[DB] Connection closed");
        }

        resolve();
      });
    } else {
      resolve();
    }
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

// All exports are now async/Promise-based.
export { getDb };
