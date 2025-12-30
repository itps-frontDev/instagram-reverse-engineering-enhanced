/**
 * @fileoverview Seed functions
 *
 * Contains all seeding logic organized by entity.
 */

import bcrypt from 'bcryptjs';
import { execute } from '@/lib/db';
import {
  TEST_USERS,
  TEST_PROFILES,
  TEST_POSTS,
  POST_ASSIGNMENTS,
  TEST_FOLLOWS,
  TEST_STORIES,
} from './data';

// ============================================================================
// USERS
// ============================================================================

export async function seedUsers() {
  console.log('🌱 Seeding users...');

  const userIds: number[] = [];

  for (const user of TEST_USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);

    const result = await execute(
      `INSERT INTO users (email, phone_number, password_hash, date_of_birth, is_email_verified)
       VALUES (?, ?, ?, ?, 1)`,
      [user.email, user.phone_number, password_hash, user.date_of_birth]
    );

    userIds.push(result.lastID);
    console.log(`   ✓ Created user: ${user.email} (ID: ${result.lastID})`);
  }

  return userIds;
}

// ============================================================================
// PROFILES
// ============================================================================

export async function seedProfiles(userIds: number[]) {
  console.log('\n🌱 Seeding profiles...');

  const profileIds: number[] = [];

  for (let i = 0; i < TEST_PROFILES.length; i++) {
    const profile = TEST_PROFILES[i];
    const userId = userIds[i];

    const result = await execute(
      `INSERT INTO profiles (
        user_id, username, full_name, bio, website_url,
        is_private, is_verified,
        followers_count, following_count, posts_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        userId,
        profile.username,
        profile.full_name,
        profile.bio,
        profile.website_url,
        profile.is_private ? 1 : 0,
        profile.is_verified ? 1 : 0,
      ]
    );

    profileIds.push(result.lastID);
    console.log(`   ✓ Created profile: @${profile.username} (ID: ${result.lastID})`);
  }

  return profileIds;
}

// ============================================================================
// POSTS
// ============================================================================

export async function seedPosts(profileIds: number[]) {
  console.log('\n🌱 Seeding posts...');

  let postIndex = 0;

  for (const assignment of POST_ASSIGNMENTS) {
    const profileId = profileIds[assignment.profileIndex];
    const profileUsername = TEST_PROFILES[assignment.profileIndex].username;

    for (let i = 0; i < assignment.count; i++) {
      const post = TEST_POSTS[postIndex++];

      const result = await execute(
        `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
         VALUES (?, ?, ?, ?)`,
        [profileId, post.caption, post.likes, post.comments]
      );

      // Add dummy media
      await execute(
        `INSERT INTO post_media (post_id, media_url, media_type, position)
         VALUES (?, ?, 'image', 0)`,
        [result.lastID, `https://picsum.photos/seed/post${result.lastID}/1080/1350`]
      );

      console.log(`   ✓ Created post: "${post.caption}" for @${profileUsername}`);
    }

    // Update profile's posts_count
    await execute(
      'UPDATE profiles SET posts_count = ? WHERE id = ?',
      [assignment.count, profileId]
    );
  }

  // --- Extra generated posts for richer dataset ---
  console.log('\n🌱 Seeding extra generated posts for each profile...');
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    // create 3 extra posts per profile
    for (let k = 0; k < 3; k++) {
      const res = await execute(
        `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
         VALUES (?, ?, ?, ?)`,
        [profileId, `Seeded post ${k + 1} for @${username}`, Math.floor(Math.random() * 200), Math.floor(Math.random() * 30)]
      );

      await execute(
        `INSERT INTO post_media (post_id, media_url, media_type, position)
         VALUES (?, ?, 'image', 0)`,
        [res.lastID, `https://picsum.photos/seed/extra${res.lastID}/1080/1350`]
      );
    }

    // update posts_count (add 3)
    await execute(
      `UPDATE profiles SET posts_count = posts_count + 3 WHERE id = ?`,
      [profileId]
    );
    console.log(`   ✓ Added 3 extra posts for @${username}`);
  }
}

// ============================================================================
// FOLLOWS
// ============================================================================

export async function seedFollows(profileIds: number[]) {
  console.log('\n🌱 Seeding follows...');

  const followerCounts: { [key: number]: number } = {};
  const followingCounts: { [key: number]: number } = {};

  for (const follow of TEST_FOLLOWS) {
    const followerProfileId = profileIds[follow.followerIndex];
    const followingProfileId = profileIds[follow.followingIndex];
    const followerUsername = TEST_PROFILES[follow.followerIndex].username;
    const followingUsername = TEST_PROFILES[follow.followingIndex].username;

    await execute(
      `INSERT INTO follows (follower_profile_id, following_profile_id, status)
       VALUES (?, ?, ?)`,
      [followerProfileId, followingProfileId, follow.status]
    );

    const statusLabel = follow.status === 'pending' ? '(pending)' : '';
    console.log(`   ✓ @${followerUsername} follows @${followingUsername} ${statusLabel}`);

    // Count only accepted follows
    if (follow.status === 'accepted') {
      followingCounts[followerProfileId] = (followingCounts[followerProfileId] || 0) + 1;
      followerCounts[followingProfileId] = (followerCounts[followingProfileId] || 0) + 1;
    }
  }

  // Update followers/following counts
  console.log('\n📊 Updating follow counts...');

  // Generate follows so each profile can see stories from all others
  console.log('\n🌱 Ensuring all profiles follow each other (for stories visibility)...');
  for (let i = 0; i < profileIds.length; i++) {
    for (let j = 0; j < profileIds.length; j++) {
      if (i === j) continue; // Don't follow yourself
      const followerProfileId = profileIds[i];
      const followingProfileId = profileIds[j];
      try {
        await execute(
          `INSERT INTO follows (follower_profile_id, following_profile_id, status)
           VALUES (?, ?, 'accepted')`,
          [followerProfileId, followingProfileId]
        );
      } catch (e) {
        // ignore unique constraint errors (follow already exists)
      }
    }
  }

  // Recompute counts from the DB to avoid mismatch
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    await execute(
      `UPDATE profiles SET followers_count = (
         SELECT COUNT(*) FROM follows WHERE following_profile_id = profiles.id AND deleted_at IS NULL AND status = 'accepted'
       ), following_count = (
         SELECT COUNT(*) FROM follows WHERE follower_profile_id = profiles.id AND deleted_at IS NULL AND status = 'accepted'
       ) WHERE id = ?`,
      [profileId]
    );
    console.log(`   ✓ Updated counts for profile id ${profileId}`);
  }
}

// ============================================================================
// STORIES
// ============================================================================

export async function seedStories(profileIds: number[]) {
  console.log('\n🌱 Seeding stories...');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now
  const createdAt = now.toISOString();
  const expiresAtStr = expiresAt.toISOString();

  for (const story of TEST_STORIES) {
    const profileId = profileIds[story.profileIndex];
    const profileUsername = TEST_PROFILES[story.profileIndex].username;

    const result = await execute(
      `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        story.media_url,
        story.media_type,
        story.duration_seconds,
        createdAt,
        expiresAtStr,
      ]
    );

    console.log(`   ✓ Created story for @${profileUsername} (ID: ${result.lastID})`);
  }

  // --- Generate extra stories per profile for richer dataset ---
  console.log('\n🌱 Seeding extra generated stories for each profile...');
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    const extraCount = 2; // two extra stories each
    for (let k = 0; k < extraCount; k++) {
      const mediaUrl = `https://picsum.photos/seed/story${i}${k}/1080/1920`;
      await execute(
        `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, created_at, expires_at)
         VALUES (?, ?, 'image', ?, ?, ?)`,
        [profileId, mediaUrl, 5, createdAt, expiresAtStr]
      );
    }
    console.log(`   ✓ Added ${extraCount} stories for @${username}`);
  }
}

// ============================================================================
// STORIES
// ============================================================================

export async function seedStories(profileIds: number[]) {
  console.log('\n🌱 Seeding stories...');

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h from now
  const createdAt = now.toISOString();
  const expiresAtStr = expiresAt.toISOString();

  for (const story of TEST_STORIES) {
    const profileId = profileIds[story.profileIndex];
    const profileUsername = TEST_PROFILES[story.profileIndex].username;

    const result = await execute(
      `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        story.media_url,
        story.media_type,
        story.duration_seconds,
        createdAt,
        expiresAtStr,
      ]
    );

    console.log(`   ✓ Created story for @${profileUsername} (ID: ${result.lastID})`);
  }
}
