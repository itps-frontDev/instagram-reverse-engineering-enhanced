import { queryAll } from '../src/lib/db';

(async () => {
  console.log('=== Check stories with deleted_at IS NULL condition ===');
  const sql = `SELECT s.id, s.profile_id, s.deleted_at, s.expires_at FROM stories s 
               WHERE s.profile_id IN (1,2) 
               AND s.deleted_at IS NULL 
               AND s.expires_at > datetime('now')`;
  const rows = await queryAll(sql);
  console.log('Rows count:', rows.length);
  console.log(rows);
})();
