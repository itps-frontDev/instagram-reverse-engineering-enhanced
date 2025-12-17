import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import * as dotenv from "dotenv";

// Carica le variabili d'ambiente
dotenv.config({ path: ".env.local" });

const pool = new Pool({
  host: process.env.DATABASE_HOST,
  port: parseInt(process.env.DATABASE_PORT || "5432"),
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  ssl: false,
});

const MIGRATION_FILES = [
  "001_users.sql",
  "002_profiles.sql",
  "003_follows.sql",
  "004_posts.sql",
  "005_post_media.sql",
  "006_post_tags.sql",
  "007_comments.sql",
  "008_stories.sql",
  "009_likes.sql",
  "010_chats.sql",
  "011_messages.sql",
  "012_chat_participants.sql",
  "013_notifications.sql",
  "014_triggers.sql",
];

async function resetDatabase() {
  console.log("🗑️  Resetting database...");
  try {
    await pool.query(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        -- Elimina tutte le tabelle
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
        -- Elimina tutte le funzioni
        FOR r IN (SELECT proname, oidvectortypes(proargtypes) as args 
                  FROM pg_proc 
                  INNER JOIN pg_namespace ns ON (pg_proc.pronamespace = ns.oid) 
                  WHERE ns.nspname = 'public') LOOP
          EXECUTE 'DROP FUNCTION IF EXISTS ' || quote_ident(r.proname) || '(' || r.args || ') CASCADE';
        END LOOP;
      END $$;
    `);
    console.log("✅ Database reset complete!\n");
  } catch (error) {
    console.error("❌ Reset failed:", error);
    throw error;
  }
}

async function runMigrations() {
  console.log("🚀 Running migrations...\n");
  const migrationsPath = join(process.cwd(), "src/db/migrations");

  for (const file of MIGRATION_FILES) {
    try {
      const filePath = join(migrationsPath, file);
      const sql = readFileSync(filePath, "utf-8");
      await pool.query(sql);
      console.log(`✅ ${file}`);
    } catch (error) {
      console.error(`❌ ${file}:`, error instanceof Error ? error.message : error);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes("--reset") || args.includes("-r");

  try {
    console.log("📦 Connecting to database...");
    await pool.query("SELECT 1");
    console.log("✅ Connected!\n");

    if (shouldReset) {
      await resetDatabase();
    }

    await runMigrations();

    console.log("\n🎉 All done!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
