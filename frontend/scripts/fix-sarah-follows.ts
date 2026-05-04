import { queryAll, execute } from '../src/lib/db';

async function run() {
  try {
    const sarah = await queryAll(`SELECT id FROM profiles WHERE username = 'sarahpublic'`);
    const john = await queryAll(`SELECT id FROM profiles WHERE username = 'johndoe'`);
    const jane = await queryAll(`SELECT id FROM profiles WHERE username = 'janedoe'`);
    if (!sarah.length || !john.length || !jane.length) {
      console.error('Profiles not found');
      return;
    }
    const sarahId = sarah[0].id as number;
    const johnId = john[0].id as number;
    const janeId = jane[0].id as number;

    async function ensureFollow(follower: number, following: number) {
      const existing = await queryAll(`SELECT id FROM follows WHERE follower_profile_id = ? AND following_profile_id = ?`, [follower, following]);
      if (existing.length === 0) {
        await execute(`INSERT INTO follows (follower_profile_id, following_profile_id, status) VALUES (?, ?, 'accepted')`, [follower, following]);
        console.log(`Inserted follow: ${follower} -> ${following}`);
      } else {
        console.log(`Follow already exists: ${follower} -> ${following}`);
      }
    }

    await ensureFollow(sarahId, johnId);
    await ensureFollow(sarahId, janeId);

    // Recompute counts
    const profileIds = [sarahId, johnId, janeId];
    for (const pid of profileIds) {
      await execute(
        `UPDATE profiles SET followers_count = (
           SELECT COUNT(*) FROM follows WHERE following_profile_id = profiles.id AND deleted_at IS NULL AND status = 'accepted'
         ), following_count = (
           SELECT COUNT(*) FROM follows WHERE follower_profile_id = profiles.id AND deleted_at IS NULL AND status = 'accepted'
         ) WHERE id = ?`,
        [pid]
      );
    }

    console.log('Done.');
  } catch (e) {
    console.error(e);
  }
}

run();
