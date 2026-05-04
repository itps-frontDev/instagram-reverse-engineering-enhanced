import { queryAll } from '../src/lib/db';

(async () => {
  console.log('=== Test: Check each condition separately ===');
  
  console.log('\n1. Only deleted_at IS NULL:');
  let rows = await queryAll(`SELECT COUNT(*) as c FROM stories WHERE profile_id IN (1,2) AND deleted_at IS NULL`);
  console.log(rows);

  console.log('\n2. Only expires_at > datetime("now"):');
  rows = await queryAll(`SELECT COUNT(*) as c FROM stories WHERE profile_id IN (1,2) AND expires_at > datetime('now')`);
  console.log(rows);

  console.log('\n3. Both conditions with AND:');
  rows = await queryAll(`SELECT COUNT(*) as c FROM stories WHERE profile_id IN (1,2) AND deleted_at IS NULL AND expires_at > datetime('now')`);
  console.log(rows);

  console.log('\n4. Check if there are ANY stories with both conditions:');
  rows = await queryAll(`SELECT id, deleted_at, expires_at FROM stories WHERE deleted_at IS NULL AND expires_at > datetime('now') LIMIT 5`);
  console.log(rows);

  console.log('\n5. Check datetime comparison:');
  rows = await queryAll(`SELECT datetime('now') as now, '2025-12-31T14:52:44.332Z' as expires_sample`);
  console.log(rows);

})();
