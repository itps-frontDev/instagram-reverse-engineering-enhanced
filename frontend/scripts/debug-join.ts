import { queryAll } from '../src/lib/db';

(async () => {
  try {
    const followingIds = [1, 2];
    
    console.log('=== Test 1: Simple SELECT ===');
    let result = await queryAll(`SELECT s.id, s.profile_id FROM stories s WHERE s.profile_id IN (${followingIds.join(',')})`);
    console.log('Result count:', result.length, result.slice(0, 2));

    console.log('\n=== Test 2: With filter ===');
    result = await queryAll(`SELECT s.id, s.profile_id FROM stories s WHERE s.profile_id IN (${followingIds.join(',')}) AND s.expires_at > datetime('now')`);
    console.log('Result count:', result.length, result.slice(0, 2));

    console.log('\n=== Test 3: With deleted_at IS NULL ===');
    result = await queryAll(`SELECT s.id, s.profile_id FROM stories s WHERE s.profile_id IN (${followingIds.join(',')}) AND s.deleted_at IS NULL AND s.expires_at > datetime('now')`);
    console.log('Result count:', result.length, result.slice(0, 2));

    console.log('\n=== Test 4: Check profiles table ===');
    result = await queryAll(`SELECT id, username FROM profiles WHERE id IN (${followingIds.join(',')})`);
    console.log('Profiles:', result);

    console.log('\n=== Test 5: Simple JOIN without WHERE ===');
    result = await queryAll(`SELECT s.id, s.profile_id, p.username FROM stories s JOIN profiles p ON p.id = s.profile_id LIMIT 5`);
    console.log('Result count:', result.length);

    console.log('\n=== Test 6: JOIN with WHERE profile_id IN ===');
    result = await queryAll(`SELECT s.id, s.profile_id, p.username FROM stories s JOIN profiles p ON p.id = s.profile_id WHERE s.profile_id IN (${followingIds.join(',')})`);
    console.log('Result count:', result.length, result.slice(0, 2));

  } catch (error) {
    console.error('Error:', error);
  }
})();
