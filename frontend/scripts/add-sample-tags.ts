/**
 * Script to add sample tags to posts for testing
 */

import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'instagram.db');
const db = new sqlite3.Database(dbPath);

const tags = [
  { post_id: 913, tagged_profile_id: 5, x: 0.3, y: 0.5 },
  { post_id: 913, tagged_profile_id: 28, x: 0.7, y: 0.3 },
  { post_id: 897, tagged_profile_id: 1, x: 0.5, y: 0.6 },
  { post_id: 897, tagged_profile_id: 81, x: 0.2, y: 0.4 },
  { post_id: 899, tagged_profile_id: 28, x: 0.6, y: 0.5 },
];

console.log('Adding sample tags...');

let completed = 0;
tags.forEach((tag) => {
  db.run(
    `INSERT OR IGNORE INTO post_tags (post_id, tagged_profile_id, x_position, y_position)
     VALUES (?, ?, ?, ?)`,
    [tag.post_id, tag.tagged_profile_id, tag.x, tag.y],
    (err) => {
      if (err) {
        console.error('Error inserting tag:', err);
      }
      completed++;
      if (completed === tags.length) {
        db.get('SELECT COUNT(*) as count FROM post_tags', [], (err, row: { count: number }) => {
          if (err) {
            console.error('Error counting tags:', err);
          } else {
            console.log(`✓ Sample tags added successfully! Total tags: ${row.count}`);
          }
          db.close();
        });
      }
    }
  );
});
