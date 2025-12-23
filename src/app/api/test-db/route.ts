/**
 * @fileoverview API route for testing database connectivity.
 *
 * This endpoint provides a simple health check for the SQLite database.
 * It returns information about the database version and existing tables.
 *
 * @module api/test-db
 *
 * @example
 * // Test the database connection
 * GET /api/test-db
 *
 * // Response on success:
 * {
 *   "success": true,
 *   "message": "Database connection successful!",
 *   "data": {
 *     "sqlite_version": "3.45.0",
 *     "tables_count": 18,
 *     "tables": ["users", "profiles", ...]
 *   }
 * }
 */

import { NextResponse } from "next/server";
import { queryOne, queryAll } from "@/lib/db";

// ============================================================================
// TYPES
// ============================================================================

/** SQLite version query result */
interface VersionResult {
  version: string;
}

/** SQLite table list query result */
interface TableResult {
  name: string;
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * Handles GET requests to test database connectivity.
 *
 * @returns JSON response with database status and table information
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Get SQLite version
    const versionResult = queryOne<VersionResult>(
      "SELECT sqlite_version() as version"
    );

    // Get list of tables (excluding SQLite internal tables)
    const tables = queryAll<TableResult>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      data: {
        sqlite_version: versionResult?.version ?? "unknown",
        tables_count: tables.length,
        tables: tables.map((t) => t.name),
      },
    });
  } catch (error) {
    console.error("[Test DB] Database connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
