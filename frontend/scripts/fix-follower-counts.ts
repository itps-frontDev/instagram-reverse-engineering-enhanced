/**
 * Script to fix follower and following counts
 * Recalculates counts based on actual follows table data
 */

import { queryAll, execute } from '../src/lib/db';

interface Profile {
  id: number;
  username: string;
  followers_count: number;
  following_count: number;
}

interface FollowCounts {
  profile_id: number;
  followers_count: number;
  following_count: number;
}

async function fixFollowerCounts() {
  console.log('🔧 Fixing follower and following counts...\n');

  try {
    // Get all profiles
    const profiles = await queryAll<Profile>(
      `SELECT id, username, followers_count, following_count 
       FROM profiles 
       WHERE deleted_at IS NULL`
    );

    console.log(`Found ${profiles.length} profiles\n`);

    for (const profile of profiles) {
      // Count actual followers (accepted follows)
      const followerResult = await queryAll<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM follows 
         WHERE following_profile_id = ? 
           AND status = 'accepted' 
           AND deleted_at IS NULL`,
        [profile.id]
      );
      const actualFollowers = followerResult[0]?.count || 0;

      // Count actual following (accepted follows)
      const followingResult = await queryAll<{ count: number }>(
        `SELECT COUNT(*) as count 
         FROM follows 
         WHERE follower_profile_id = ? 
           AND status = 'accepted' 
           AND deleted_at IS NULL`,
        [profile.id]
      );
      const actualFollowing = followingResult[0]?.count || 0;

      // Check if counts are wrong
      const needsUpdate = 
        profile.followers_count !== actualFollowers || 
        profile.following_count !== actualFollowing;

      if (needsUpdate) {
        console.log(`❌ @${profile.username} (ID: ${profile.id}):`);
        console.log(`   Followers: ${profile.followers_count} → ${actualFollowers}`);
        console.log(`   Following: ${profile.following_count} → ${actualFollowing}`);

        // Update the counts
        await execute(
          `UPDATE profiles 
           SET followers_count = ?, 
               following_count = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [actualFollowers, actualFollowing, profile.id]
        );

        console.log(`   ✅ Fixed!\n`);
      } else {
        console.log(`✅ @${profile.username} - Counts are correct`);
      }
    }

    console.log('\n✨ All follower counts have been fixed!');
  } catch (error) {
    console.error('Error fixing follower counts:', error);
    throw error;
  }
}

// Run the script
fixFollowerCounts()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed:', error);
    process.exit(1);
  });
