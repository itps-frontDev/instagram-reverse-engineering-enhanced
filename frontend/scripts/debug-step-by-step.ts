import { queryAll } from '../src/lib/db';

(async () => {
  try {
    const currentProfileId = 4;
    
    console.log('=== Step 1: Check if profile exists ===');
    const profile = await queryAll('SELECT id, username FROM profiles WHERE id = ?', [currentProfileId]);
    console.log('Profile:', profile);

    console.log('\n=== Step 2: Check follows for this profile ===');
    const follows = await queryAll(
      'SELECT following_profile_id FROM follows WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = ?',
      [currentProfileId, 'accepted']
    );
    console.log('Follows:', follows);

    console.log('\n=== Step 3: Check stories for those followed profiles (static) ===');
    const followingIds = follows.map(f => f.following_profile_id);
    if (followingIds.length > 0) {
      const storyQuery = `SELECT s.id, s.profile_id, s.expires_at, datetime('now') as now FROM stories s WHERE s.profile_id IN (${followingIds.join(',')})`;
      const stories = await queryAll(storyQuery);
      console.log('Stories for followed profiles:', stories);

      console.log('\n=== Step 4: Check stories with expires_at filter ===');
      const storiesActive = await queryAll(
        `SELECT s.id, s.profile_id, s.expires_at FROM stories s WHERE s.profile_id IN (${followingIds.join(',')}) AND s.expires_at > datetime('now')`
      );
      console.log('Active stories:', storiesActive);

      console.log('\n=== Step 5: Full join query (static) ===');
      const fullQuery = `SELECT s.id, s.profile_id, p.username FROM stories s JOIN profiles p ON p.id = s.profile_id WHERE s.profile_id IN (${followingIds.join(',')}) AND s.deleted_at IS NULL AND s.expires_at > datetime('now')`;
      const fullResult = await queryAll(fullQuery);
      console.log('Full join result:', fullResult);
    } else {
      console.log('No follows found!');
    }

  } catch (error) {
    console.error('Error:', error);
  }
})();
