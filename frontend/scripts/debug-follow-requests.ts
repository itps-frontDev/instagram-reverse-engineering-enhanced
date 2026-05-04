/**
 * Script per debuggare le notifiche follow_request e i relativi record follows
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'data', 'instagram.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Errore connessione database:', err);
    process.exit(1);
  }
  
  console.log('🔍 Controllo notifiche follow_request...\n');

  // Query per trovare le notifiche follow_request con o senza follow corrispondente
  const query = `
    SELECT 
      n.id as notification_id,
      n.type as notification_type,
      n.sender_profile_id,
      n.recipient_profile_id,
      n.created_at as notification_created_at,
      f.id as follow_id,
      f.status as follow_status,
      f.deleted_at as follow_deleted_at,
      p1.username as sender_username,
      p2.username as recipient_username
    FROM notifications n
    LEFT JOIN follows f ON 
      f.follower_profile_id = n.sender_profile_id 
      AND f.following_profile_id = n.recipient_profile_id 
      AND f.deleted_at IS NULL
    LEFT JOIN profiles p1 ON p1.id = n.sender_profile_id
    LEFT JOIN profiles p2 ON p2.id = n.recipient_profile_id
    WHERE n.type = 'follow_request'
    ORDER BY n.created_at DESC;
  `;

  db.all(query, [], (err, results: any[]) => {
    if (err) {
      console.error('❌ Errore query:', err);
      db.close();
      process.exit(1);
    }

    console.log(`📊 Trovate ${results.length} notifiche follow_request attive\n`);

    if (results.length === 0) {
      console.log('✅ Non ci sono notifiche follow_request nel database');
      
      // Procedi con il controllo dei follow pending
      checkPendingFollows();
    } else {
      results.forEach((row: any, index: number) => {
        console.log(`\n--- Notifica #${index + 1} ---`);
        console.log(`  Notification ID: ${row.notification_id}`);
        console.log(`  Sender: ${row.sender_username} (ID: ${row.sender_profile_id})`);
        console.log(`  Recipient: ${row.recipient_username} (ID: ${row.recipient_profile_id})`);
        console.log(`  Created: ${row.notification_created_at}`);
        
        if (row.follow_id) {
          console.log(`  ✅ Follow trovato:`);
          console.log(`     - Follow ID: ${row.follow_id}`);
          console.log(`     - Status: ${row.follow_status}`);
          console.log(`     - Deleted: ${row.follow_deleted_at || 'No'}`);
        } else {
          console.log(`  ❌ NESSUN FOLLOW CORRISPONDENTE TROVATO`);
          console.log(`  🔧 Questa notifica è orfana e dovrebbe essere rimossa o riparata`);
        }
      });

      // Conta le notifiche orfane
      const orphanedCount = results.filter((r: any) => !r.follow_id).length;
      if (orphanedCount > 0) {
        console.log(`\n\n⚠️  PROBLEMA TROVATO: ${orphanedCount} notifiche follow_request orfane`);
        console.log(`   (notifiche senza record follow corrispondente)`);
        console.log(`\n💡 Soluzioni possibili:`);
        console.log(`   1. Rimuovere le notifiche orfane`);
        console.log(`   2. Creare record follow mancanti con status 'pending'`);
      } else {
        console.log(`\n\n✅ Tutte le notifiche hanno un follow corrispondente`);
      }
      
      // Procedi con il controllo dei follow pending
      checkPendingFollows();
    }
  });
});

function checkPendingFollows() {
  // Controlla anche i follow pending senza notifiche
  console.log('\n\n🔍 Controllo follow pending senza notifiche...\n');

  const pendingQuery = `
    SELECT 
      f.id as follow_id,
      f.follower_profile_id,
      f.following_profile_id,
      f.status,
      f.created_at,
      p1.username as follower_username,
      p2.username as following_username,
      p2.is_private,
      n.id as notification_id
    FROM follows f
    LEFT JOIN notifications n ON 
      n.sender_profile_id = f.follower_profile_id 
      AND n.recipient_profile_id = f.following_profile_id
      AND n.type = 'follow_request'
    LEFT JOIN profiles p1 ON p1.id = f.follower_profile_id
    LEFT JOIN profiles p2 ON p2.id = f.following_profile_id
    WHERE f.status = 'pending' 
      AND f.deleted_at IS NULL
    ORDER BY f.created_at DESC;
  `;

  db.all(pendingQuery, [], (err, pendingResults: any[]) => {
    if (err) {
      console.error('❌ Errore query pending:', err);
      db.close();
      process.exit(1);
    }

    console.log(`📊 Trovati ${pendingResults.length} follow pending\n`);

    if (pendingResults.length > 0) {
      pendingResults.forEach((row: any, index: number) => {
        console.log(`\n--- Follow Pending #${index + 1} ---`);
        console.log(`  Follow ID: ${row.follow_id}`);
        console.log(`  Follower: ${row.follower_username} (ID: ${row.follower_profile_id})`);
        console.log(`  Following: ${row.following_username} (ID: ${row.following_profile_id})`);
        console.log(`  Target is private: ${row.is_private ? 'Yes' : 'No'}`);
        console.log(`  Created: ${row.created_at}`);
        
        if (row.notification_id) {
          console.log(`  ✅ Notifica trovata (ID: ${row.notification_id})`);
        } else {
          console.log(`  ❌ NESSUNA NOTIFICA CORRISPONDENTE`);
          console.log(`  🔧 Dovrebbe esserci una notifica follow_request`);
        }
      });

      const missingNotifications = pendingResults.filter((r: any) => !r.notification_id).length;
      if (missingNotifications > 0) {
        console.log(`\n\n⚠️  PROBLEMA TROVATO: ${missingNotifications} follow pending senza notifiche`);
      } else {
        console.log(`\n\n✅ Tutti i follow pending hanno una notifica corrispondente`);
      }
    }

    db.close();
    console.log('\n\n✅ Analisi completata');
  });
}
