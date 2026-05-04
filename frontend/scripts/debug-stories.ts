import { queryAll } from '../src/lib/db';

async function run() {
  try {
    console.log('Profiles:');
    const profiles = await queryAll(`SELECT id, username, is_private, followers_count, following_count FROM profiles`);
    console.table(profiles);

    console.log('\nFollows (sample):');
    const follows = await queryAll(`SELECT id, follower_profile_id, following_profile_id, status FROM follows`);
    console.table(follows.slice(0, 50));

    console.log('\nStories:');
    const stories = await queryAll(`SELECT id, profile_id, media_url, created_at, expires_at, views_count, deleted_at FROM stories ORDER BY id`);
    console.table(stories);

    console.log('\nActive stories (expires_at > now):');
    const active = await queryAll(`SELECT id, profile_id, created_at, expires_at FROM stories WHERE deleted_at IS NULL AND expires_at > datetime('now') ORDER BY id`);
    console.table(active);

    console.log('\nStories visible to sarahpublic (profile id lookup):');
    const sarah = await queryAll(`SELECT id FROM profiles WHERE username = 'sarahpublic'`);
    console.log(sarah);
    if (sarah.length > 0) {
      const sarahId = sarah[0].id;
      const visible = await queryAll(`
        SELECT s.id, s.profile_id, p.username, s.created_at, s.expires_at
        FROM stories s
        JOIN profiles p ON p.id = s.profile_id
        WHERE s.profile_id IN (
          SELECT following_profile_id FROM follows WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'
        )
        AND s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
      `, [sarahId]);
      console.table(visible);
    }
  } catch (e) {
    console.error(e);
  }
}

run();
