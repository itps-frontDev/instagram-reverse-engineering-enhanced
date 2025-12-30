import { queryAll } from '../src/lib/db';

(async ()=>{
  const sarah = await queryAll(`SELECT id FROM profiles WHERE username='sarahpublic'`);
  console.log('sarah', sarah);
  const sarahId = sarah[0].id;
  const following = await queryAll(`SELECT following_profile_id FROM follows WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'`, [sarahId]);
  console.log('following rows:', following);
  const rows = await queryAll(`SELECT s.id, s.profile_id, p.username FROM stories s JOIN profiles p ON p.id = s.profile_id WHERE s.profile_id IN (SELECT following_profile_id FROM follows WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted') AND s.deleted_at IS NULL AND s.expires_at > datetime('now')`, [sarahId]);
  console.log('visible stories rows:', rows);
  const rows2 = await queryAll(`SELECT s.id, s.profile_id, p.username FROM stories s JOIN profiles p ON p.id = s.profile_id WHERE s.profile_id IN (1,2) AND s.deleted_at IS NULL AND s.expires_at > datetime('now')`);
  console.log('visible stories rows using IN (1,2):', rows2);
  const rows3 = await queryAll(`SELECT id, profile_id, expires_at FROM stories WHERE profile_id IN (1,2)`);
  console.log('stories for profile 1,2 with expires_at:', rows3);
  const rows4 = await queryAll(`SELECT id, profile_id, expires_at FROM stories WHERE profile_id IN (1,2) AND expires_at > datetime('now')`);
  console.log('stories for profile 1,2 with expires_at > now:', rows4);
})();
