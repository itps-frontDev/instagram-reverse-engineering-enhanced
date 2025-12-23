/**
 * @fileoverview Database migration and reset script.
 *
 * This script initializes the SQLite database by executing the schema.sql file.
 * It can also reset the database by deleting the existing file first.
 *
 * @module db/migrate
 *
 * @example
 * // Run migrations (create tables if not exist)
 * pnpm db:migrate
 *
 * // Reset and recreate database
 * pnpm db:reset
 */

import Database from "better-sqlite3";
import { readFileSync, existsSync, mkdirSync, unlinkSync } from "fs";
import { join } from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** Base directory for data storage */
const DATA_DIR = join(process.cwd(), "data");

/** Path to the SQLite database file */
const DB_PATH = join(DATA_DIR, "instagram.db");

/** Path to the schema SQL file */
const SCHEMA_PATH = join(process.cwd(), "src", "db", "schema.sql");

// ============================================================================
// SETUP
// ============================================================================

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Deletes the existing database file and associated WAL files.
 *
 * SQLite with WAL mode creates additional files:
 * - instagram.db-wal (Write-Ahead Log)
 * - instagram.db-shm (Shared Memory)
 *
 * All three must be deleted for a clean reset.
 */
function resetDatabase(): void {
  console.log("🗑️  Resetting database...\n");

  const filesToDelete = [
    DB_PATH,
    `${DB_PATH}-wal`,
    `${DB_PATH}-shm`,
  ];

  for (const file of filesToDelete) {
    if (existsSync(file)) {
      unlinkSync(file);
      console.log(`   Deleted: ${file}`);
    }
  }

  console.log("\n✅ Database reset complete!\n");
}

/**
 * Creates the database and executes the schema SQL.
 *
 * Configures the database with:
 * - WAL mode for better concurrent performance
 * - Foreign keys enabled for referential integrity
 */
function createSchema(): void {
  console.log("🚀 Creating database schema...\n");

  // Verify schema file exists
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ Schema file not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  // Initialize database
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  try {
    // Read and execute schema
    const sql = readFileSync(SCHEMA_PATH, "utf-8");
    db.exec(sql);

    // Get list of created tables
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[];

    console.log(`✅ Created ${tables.length} tables:\n`);
    for (const table of tables) {
      console.log(`   • ${table.name}`);
    }
  } catch (error) {
    console.error(
      "❌ Schema creation failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  } finally {
    db.close();
  }
}

/**
 * Displays usage information for the script.
 */
function showHelp(): void {
  console.log(`
📦 Instagram Clone - Database Setup

Usage:
  pnpm db:migrate          Create tables (if not exist)
  pnpm db:reset            Delete and recreate database

Options:
  --reset, -r              Reset database before migration
  --help, -h               Show this help message

Files:
  Database: ${DB_PATH}
  Schema:   ${SCHEMA_PATH}
`);
}

// ============================================================================
// MAIN
// ============================================================================

/**
 * Main entry point for the migration script.
 *
 * Parses command line arguments and executes the appropriate operations.
 */
function main(): void {
  const args = process.argv.slice(2);

  // Show help
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  // Check for reset flag
  const shouldReset = args.includes("--reset") || args.includes("-r");

  console.log("\n📦 Instagram Clone - Database Setup\n");
  console.log("─".repeat(50) + "\n");

  // Reset if requested
  if (shouldReset) {
    resetDatabase();
  }

  // Create schema
  createSchema();

  console.log("\n" + "─".repeat(50));
  console.log("\n🎉 Database setup complete!");
  console.log(`📁 Location: ${DB_PATH}\n`);
}

// Run the script
main();
