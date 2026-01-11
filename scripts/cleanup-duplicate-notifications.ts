/**
 * Script per rimuovere le notifiche duplicate
 * Mantiene solo la notifica più recente per ogni combinazione di:
 * - type, sender_profile_id, recipient_profile_id, reference_type, reference_id
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'instagram.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Errore connessione database:', err);
    process.exit(1);
  }
  
  console.log('🧹 Pulizia notifiche duplicate...\n');

  // Query per trovare i gruppi di notifiche duplicate
  const findDuplicatesQuery = `
    SELECT 
      type,
      sender_profile_id,
      recipient_profile_id,
      reference_type,
      reference_id,
      COUNT(*) as count,
      GROUP_CONCAT(id ORDER BY created_at DESC) as ids,
      MAX(created_at) as latest_created_at
    FROM notifications
    WHERE type IN ('follow', 'follow_request', 'like_post', 'like_comment', 'comment')
    GROUP BY type, sender_profile_id, recipient_profile_id, reference_type, reference_id
    HAVING COUNT(*) > 1
  `;

  db.all(findDuplicatesQuery, [], (err, duplicateGroups: any[]) => {
    if (err) {
      console.error('❌ Errore query:', err);
      db.close();
      process.exit(1);
    }

    if (duplicateGroups.length === 0) {
      console.log('✅ Nessuna notifica duplicata trovata!');
      db.close();
      return;
    }

    console.log(`📊 Trovati ${duplicateGroups.length} gruppi di notifiche duplicate:\n`);
    
    let totalDuplicates = 0;
    const idsToDelete: number[] = [];

    duplicateGroups.forEach((group, index) => {
      const ids = group.ids.split(',').map((id: string) => parseInt(id));
      const duplicateCount = ids.length - 1; // manteniamo l'ultima
      totalDuplicates += duplicateCount;

      console.log(`${index + 1}. Type: ${group.type}, Duplicati: ${duplicateCount}`);
      console.log(`   Sender: ${group.sender_profile_id}, Recipient: ${group.recipient_profile_id}`);
      
      // Rimuovi tutti tranne il primo (più recente)
      idsToDelete.push(...ids.slice(1));
    });

    console.log(`\n🗑️  Totale notifiche da rimuovere: ${totalDuplicates}\n`);
    console.log('Rimozione in corso...\n');

    // Rimuovi le notifiche duplicate
    const placeholders = idsToDelete.map(() => '?').join(',');
    const deleteQuery = `DELETE FROM notifications WHERE id IN (${placeholders})`;

    db.run(deleteQuery, idsToDelete, function(err) {
      if (err) {
        console.error('❌ Errore durante la rimozione:', err);
        db.close();
        process.exit(1);
      }

      console.log(`✅ Rimosse ${this.changes} notifiche duplicate con successo!`);
      console.log('\n✨ Database pulito! Ogni utente ora ha solo una notifica per ogni azione.');
      
      db.close();
    });
  });
});
