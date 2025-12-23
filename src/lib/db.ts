/**
 * @fileoverview Database module for SQLite connection and query utilities.
 *
 * This module provides a singleton database connection and helper functions
 * for executing SQL queries against the SQLite database.
 *
 * @module lib/db
 * @requires better-sqlite3
 *
 * @example
 * // Import and use query functions
 * import { queryAll, queryOne, execute } from '@/lib/db';
 *
 * // Select multiple rows
 * const users = queryAll<User>('SELECT * FROM users WHERE deleted_at IS NULL');
 *
 * // Select single row
 * const user = queryOne<User>('SELECT * FROM users WHERE id = ?', [userId]);
 *
 * // Insert/Update/Delete
 * const result = execute('INSERT INTO users (email) VALUES (?)', [email]);
 */

import Database from "better-sqlite3";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Flag to check if running in production environment */
const IS_PRODUCTION = process.env.NODE_ENV === "production";

/** Base directory for data storage (database, uploads, etc.) */
const DATA_DIR = join(process.cwd(), "data");

/** Full path to the SQLite database file */
const DB_PATH = join(DATA_DIR, "instagram.db");

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

// Ensure the data directory exists before initializing the database
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Singleton database instance.
 *
 * Configured with:
 * - WAL mode for better concurrent read performance
 * - Foreign keys enabled for referential integrity
 *
 * @see https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md
 */
const db = new Database(DB_PATH);

// Configure SQLite for optimal performance and data integrity
db.pragma("journal_mode = WAL"); // Write-Ahead Logging for better concurrency
db.pragma("foreign_keys = ON"); // Enforce foreign key constraints

// Log connection status in development
if (!IS_PRODUCTION) {
  console.log(`[DB] Connected to SQLite database: ${DB_PATH}`);
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Executes a SELECT query and returns all matching rows.
 *
 * @template T - The expected type of each row in the result set
 * @param sql - The SQL query string with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns An array of rows matching the query, typed as T[]
 *
 * @example
 * // Get all active users
 * const users = queryAll<User>(
 *   'SELECT * FROM users WHERE deleted_at IS NULL'
 * );
 *
 * @example
 * // Get users with specific role
 * const admins = queryAll<User>(
 *   'SELECT * FROM users WHERE role = ?',
 *   ['admin']
 * );
 */
export function queryAll<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): T[] {
  const start = Date.now();
  const stmt = db.prepare(sql);
  const result = params ? stmt.all(...params) : stmt.all();
  const duration = Date.now() - start;

  // Log query execution in development for debugging
  if (!IS_PRODUCTION) {
    console.log("[DB] Query executed", {
      sql: sql.length > 80 ? sql.substring(0, 80) + "..." : sql,
      duration: `${duration}ms`,
      rows: result.length,
    });
  }

  return result as T[];
}

/**
 * Executes a SELECT query and returns the first matching row.
 *
 * @template T - The expected type of the result row
 * @param sql - The SQL query string with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns The first matching row typed as T, or undefined if no match
 *
 * @example
 * // Get user by ID
 * const user = queryOne<User>(
 *   'SELECT * FROM users WHERE id = ?',
 *   [userId]
 * );
 *
 * @example
 * // Get user by email (unique constraint)
 * const user = queryOne<User>(
 *   'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
 *   [email]
 * );
 */
export function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): T | undefined {
  const stmt = db.prepare(sql);
  const result = params ? stmt.get(...params) : stmt.get();
  return result as T | undefined;
}

/**
 * Executes an INSERT, UPDATE, or DELETE query.
 *
 * @param sql - The SQL statement with optional placeholders (?)
 * @param params - Optional array of values to bind to placeholders
 * @returns A RunResult object containing:
 *   - `changes`: Number of rows affected
 *   - `lastInsertRowid`: The rowid of the last inserted row (for INSERT)
 *
 * @example
 * // Insert a new user
 * const result = execute(
 *   'INSERT INTO users (email, password_hash) VALUES (?, ?)',
 *   [email, passwordHash]
 * );
 * console.log('New user ID:', result.lastInsertRowid);
 *
 * @example
 * // Update a user
 * const result = execute(
 *   'UPDATE users SET email = ? WHERE id = ?',
 *   [newEmail, userId]
 * );
 * console.log('Rows updated:', result.changes);
 *
 * @example
 * // Soft delete a user
 * execute(
 *   "UPDATE users SET deleted_at = datetime('now') WHERE id = ?",
 *   [userId]
 * );
 */
export function execute(sql: string, params?: unknown[]): Database.RunResult {
  const stmt = db.prepare(sql);
  return params ? stmt.run(...params) : stmt.run();
}

/**
 * Executes multiple SQL statements at once.
 *
 * Useful for running migrations or initialization scripts.
 * Note: This does not support parameter binding.
 *
 * @param sql - A string containing one or more SQL statements
 * @throws Error if any statement fails to execute
 *
 * @example
 * // Run a migration script
 * const migrationSQL = fs.readFileSync('migration.sql', 'utf-8');
 * executeScript(migrationSQL);
 */
export function executeScript(sql: string): void {
  db.exec(sql);
}

/**
 * Executes multiple operations within a single transaction.
 *
 * All operations will be committed together, or rolled back if any fails.
 * This ensures data consistency for complex operations.
 *
 * @template T - The return type of the callback function
 * @param callback - A function containing the database operations to execute
 * @returns The return value of the callback function
 *
 * @example
 * // Transfer funds between accounts (atomic operation)
 * const result = transaction(() => {
 *   execute('UPDATE accounts SET balance = balance - ? WHERE id = ?', [amount, fromId]);
 *   execute('UPDATE accounts SET balance = balance + ? WHERE id = ?', [amount, toId]);
 *   return { success: true };
 * });
 *
 * @example
 * // Create user with profile (all or nothing)
 * const userId = transaction(() => {
 *   const userResult = execute('INSERT INTO users (email) VALUES (?)', [email]);
 *   execute('INSERT INTO profiles (user_id, username) VALUES (?, ?)', [
 *     userResult.lastInsertRowid,
 *     username
 *   ]);
 *   return userResult.lastInsertRowid;
 * });
 */
export function transaction<T>(callback: () => T): T {
  return db.transaction(callback)();
}

/**
 * Closes the database connection.
 *
 * Should be called when the application is shutting down to ensure
 * all pending operations are completed and resources are released.
 *
 * @example
 * // In your app shutdown handler
 * process.on('SIGINT', () => {
 *   closeDb();
 *   process.exit(0);
 * });
 */
export function closeDb(): void {
  db.close();
  if (!IS_PRODUCTION) {
    console.log("[DB] Connection closed");
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

/** The raw database instance for advanced operations */
export default db;
