/**
 * Script per rimuovere le notifiche follow_request orfane
 * (notifiche senza un record follow corrispondente)
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'instagram.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Errore connessione database:', err);
    process.exit(1);
  }
  
  console.log('🧹 Pulizia notifiche follow_request orfane...\n');

  // Prima mostra quali notifiche verranno rimosse
  const selectQuery = `
    SELECT 
      n.id,
      n.sender_profile_id,
      n.recipient_profile_id,
      p1.username as sender_username,
      p2.username as recipient_username,
      n.created_at
    FROM notifications n
    LEFT JOIN follows f ON 
      f.follower_profile_id = n.sender_profile_id 
      AND f.following_profile_id = n.recipient_profile_id 
      AND f.deleted_at IS NULL
    LEFT JOIN profiles p1 ON p1.id = n.sender_profile_id
    LEFT JOIN profiles p2 ON p2.id = n.recipient_profile_id
    WHERE n.type = 'follow_request'
      AND f.id IS NULL
  `;

  db.all(selectQuery, [], (err, orphanedNotifications: any[]) => {
    if (err) {
      console.error('❌ Errore query:', err);
      db.close();
      process.exit(1);
    }

    if (orphanedNotifications.length === 0) {
      console.log('✅ Nessuna notifica orfana trovata!');
      db.close();
      return;
    }

    console.log(`📊 Trovate ${orphanedNotifications.length} notifiche orfane da rimuovere:\n`);
    
    orphanedNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. Notification ID ${notif.id}: ${notif.sender_username} → ${notif.recipient_username} (${notif.created_at})`);
    });

    console.log('\n🗑️  Rimozione in corso...\n');

    // Rimuovi le notifiche orfane
    const deleteQuery = `
      DELETE FROM notifications
      WHERE id IN (
        SELECT n.id
        FROM notifications n
        LEFT JOIN follows f ON 
          f.follower_profile_id = n.sender_profile_id 
          AND f.following_profile_id = n.recipient_profile_id 
          AND f.deleted_at IS NULL
        WHERE n.type = 'follow_request'
          AND f.id IS NULL
      )
    `;

    db.run(deleteQuery, [], function(err) {
      if (err) {
        console.error('❌ Errore durante la rimozione:', err);
        db.close();
        process.exit(1);
      }

      console.log(`✅ Rimosse ${this.changes} notifiche orfane con successo!`);
      console.log('\n✨ Database pulito! I pulsanti Conferma/Elimina ora dovrebbero funzionare correttamente.');
      
      db.close();
    });
  });
});
