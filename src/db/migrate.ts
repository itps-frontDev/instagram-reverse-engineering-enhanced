/**
 * @fileoverview Script di migrazione e reset del database
 *
 * Inizializza il database SQLite eseguendo il file schema.sql.
 * Può anche eseguire un reset eliminando il file esistente prima di ricrearlo.
 *
 * @module db/migrate
 *
 * @example
 * // Esegue le migrazioni (crea le tabelle se mancanti)
 * pnpm db:migrate
 *
 * // Reset completo e ricreazione del database
 * pnpm db:reset
 */

import { readFile, unlink, access } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { executeScript, queryAll } from "@/lib/db";

// ============================================================================
// CONFIGURAZIONE
// ============================================================================

/** Directory base per l'archiviazione dei dati */
const DATA_DIR = join(process.cwd(), "data");

/** Percorso del file di database SQLite */
const DB_PATH = join(DATA_DIR, "instagram.db");

/** Percorso del file SQL che contiene lo schema */
const SCHEMA_PATH = join(process.cwd(), "src", "db", "schema.sql");

// ============================================================================
// PREPARAZIONE
// ============================================================================

// Crea la directory dei dati se non esiste già
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// ============================================================================
// FUNZIONI PRINCIPALI
// ============================================================================

/**
 * Elimina il file di database esistente e i file WAL associati.
 * Se i file risultano bloccati, in alternativa svuota tutte le tabelle.
 *
 * SQLite in modalità WAL genera file aggiuntivi:
 * - instagram.db-wal (Write-Ahead Log)
 * - instagram.db-shm (Shared Memory)
 *
 * Tutti e tre vanno eliminati per ottenere un reset pulito.
 */
async function resetDatabase(): Promise<void> {
  console.log("🗑️  Reset del database...\n");

  const filesToDelete = [DB_PATH, `${DB_PATH}-wal`, `${DB_PATH}-shm`];
  let hasErrors = false;

  for (const file of filesToDelete) {
    try {
      await access(file);
      await unlink(file);
      console.log(`   ✅ Eliminato: ${file}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Il file non esiste, si prosegue
        continue;
      }
      
      // File bloccato o altro errore
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.log('\n⚠️  File del database bloccati (server dev in esecuzione?)');
    console.log('   Fallback: svuoto tutte le tabelle...\n');
    
    try {
      // Import dinamico per evitare dipendenze circolari
      const { execute, queryAll } = await import('@/lib/db');
      
      // Disabilita temporaneamente le foreign key
      await execute('PRAGMA foreign_keys = OFF');
      
      // Recupera tutte le tabelle utente
      const tables = await queryAll<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      
      // Elimina tutti i dati da ogni tabella
      for (const table of tables) {
        await execute(`DELETE FROM ${table.name}`);
        console.log(`   ✅ Svuotata: ${table.name}`);
      }
      
      // Riattiva le foreign key
      await execute('PRAGMA foreign_keys = ON');
      
      // Reset delle sequenze autoincrement
      await execute('DELETE FROM sqlite_sequence');
      
      console.log('\n✅ Dati eliminati con successo!\n');
    } catch (error) {
      console.error('\n❌ Impossibile svuotare i dati:', error);
      process.exit(1);
    }
    
    return;
  }

  console.log("\n✅ Reset del database completato!\n");
}

/**
 * Crea il database ed esegue lo schema SQL.
 *
 * Configura il database con:
 * - modalità WAL per prestazioni migliori in concorrenza
 * - foreign key abilitate per l'integrità referenziale
 */
async function createSchema(): Promise<void> {
  console.log("🚀 Creazione dello schema del database...\n");

  // Verifica che il file dello schema esista
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`❌ File schema non trovato: ${SCHEMA_PATH}`);
    process.exit(1);
  }

  try {
    // Legge ed esegue lo schema
    const sql = await readFile(SCHEMA_PATH, "utf-8");
    await executeScript(sql);

    // Elenco delle tabelle create
    const tables = await queryAll<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );

    console.log(`✅ Create ${tables.length} tabelle:\n`);
    for (const table of tables) {
      console.log(`   • ${table.name}`);
    }
  } catch (error) {
    console.error(
      "❌ Creazione dello schema fallita:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

/**
 * Mostra le istruzioni d'uso dello script.
 */
function showHelp(): void {
  console.log(`
📦 Instagram Clone - Configurazione Database

Utilizzo:
  pnpm db:migrate          Crea le tabelle se mancanti
  pnpm db:reset            Elimina e ricrea il database

Opzioni:
  --reset, -r              Esegue il reset prima della migrazione
  --help, -h               Mostra questo messaggio

Percorsi:
  Database: ${DB_PATH}
  Schema:   ${SCHEMA_PATH}
`);
}

// ============================================================================
// AVVIO SCRIPT
// ============================================================================

/**
 * Punto di ingresso principale dello script di migrazione.
 *
 * Analizza gli argomenti CLI ed esegue le operazioni richieste.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Mostra la guida
  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    return;
  }

  // Verifica se è richiesto il reset
  const shouldReset = args.includes("--reset") || args.includes("-r");

  console.log("\n📦 Instagram Clone - Configurazione Database\n");
  console.log("─".repeat(50) + "\n");

  // Esegue il reset se richiesto
  if (shouldReset) {
    await resetDatabase();
  }

  // Crea lo schema
  await createSchema();

  console.log("\n" + "─".repeat(50));
  console.log("\n🎉 Configurazione del database completata!");
  console.log(`📁 Percorso: ${DB_PATH}\n`);
}

// Run the script
main().catch(console.error);
