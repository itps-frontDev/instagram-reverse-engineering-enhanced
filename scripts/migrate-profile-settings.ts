/**
 * @fileoverview Migration script to add profile settings columns
 *
 * Adds show_threads_badge and show_suggested_accounts columns to profiles table
 *
 * Usage: npm run migrate:profile-settings
 * or: npx tsx scripts/migrate-profile-settings.ts
 */

import Database from 'better-sqlite3';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'instagram.db');

async function migrate() {
  console.log('🔄 Starting migration: Add profile settings columns...');
  
  const db = new Database(DB_PATH);
  
  try {
    // Check if columns already exist
    const tableInfo = db.pragma('table_info(profiles)');
    const columnNames = tableInfo.map((col: any) => col.name);
    
    const hasThreadsBadge = columnNames.includes('show_threads_badge');
    const hasSuggestedAccounts = columnNames.includes('show_suggested_accounts');
    
    if (hasThreadsBadge && hasSuggestedAccounts) {
      console.log('✅ Columns already exist. Migration not needed.');
      db.close();
      return;
    }
    
    db.exec('BEGIN TRANSACTION');
    
    // Add show_threads_badge column if missing
    if (!hasThreadsBadge) {
      console.log('Adding column: show_threads_badge...');
      db.exec(`
        ALTER TABLE profiles
        ADD COLUMN show_threads_badge INTEGER NOT NULL DEFAULT 0
      `);
      console.log('✅ Column show_threads_badge added');
    }
    
    // Add show_suggested_accounts column if missing
    if (!hasSuggestedAccounts) {
      console.log('Adding column: show_suggested_accounts...');
      db.exec(`
        ALTER TABLE profiles
        ADD COLUMN show_suggested_accounts INTEGER NOT NULL DEFAULT 1
      `);
      console.log('✅ Column show_suggested_accounts added');
    }
    
    db.exec('COMMIT');
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    try {
      db.exec('ROLLBACK');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError);
    }
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run migration
migrate().catch((err) => {
  console.error('❌ Unexpected error:', err);
  process.exit(1);
});
