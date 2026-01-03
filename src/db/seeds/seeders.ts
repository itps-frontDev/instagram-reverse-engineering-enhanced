// ============================================================================
// POSTS
// ============================================================================

export async function seedPosts(profileIds: number[]) {
  console.log('\n🌱 Seeding posts...');

  const POST_CAPTIONS = [
    'Another beautiful day ☀️',
    'Living for moments like these',
    'Grateful for this view',
    'Can\'t believe this is real 😍',
    'Just vibing ✨',
    'Weekend mood',
    'Making memories',
    'Good times with great people',
    'Chasing sunsets',
    'Adventure awaits',
    'Feeling blessed',
    'Life is beautiful',
    'Creating my own sunshine',
    'Just because',
    'No filter needed',
    'Capturing the moment',
    'Living my truth',
    'Here\'s to the good times',
    'Happiness looks good on me',
    'Throwback to this amazing day',
  ];

  const allPostIds: number[] = [];
  let totalPosts = 0;

  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    const numPosts = POST_ASSIGNMENTS[i].count;

    for (let j = 0; j < numPosts; j++) {
      const caption = POST_CAPTIONS[Math.floor(Math.random() * POST_CAPTIONS.length)];
      const likesCount = Math.floor(Math.random() * 491) + 10; // 10-500
      const commentsCount = Math.floor(Math.random() * 51); // 0-50
      const hasMultipleMedia = Math.random() < 0.3; // 30% chance of multiple images
      const mediaCount = hasMultipleMedia ? Math.floor(Math.random() * 4) + 2 : 1; // 2-5 images or 1

      const result = await execute(
        `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
         VALUES (?, ?, ?, ?)`,
        [profileId, caption, likesCount, commentsCount]
      );

      const postId = result.lastID;
      allPostIds.push(postId);

      // Add media for this post
      for (let k = 0; k < mediaCount; k++) {
        const mediaUrl = `https://picsum.photos/seed/post${postId}img${k}/1080/1350`;
        await execute(
          `INSERT INTO post_media (post_id, media_url, media_type, position)
           VALUES (?, ?, 'image', ?)`,
          [postId, mediaUrl, k]
        );
      }

      totalPosts++;
    }

    // Update posts_count
    await execute(
      'UPDATE profiles SET posts_count = ? WHERE id = ?',
      [numPosts, profileId]
    );

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generated posts for ${i + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalPosts} posts successfully!`);

  return allPostIds; // Return post IDs for tagging
}
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
  }

  return profileIds;
}

// ============================================================================
// FOLLOWS
// ============================================================================

export async function seedFollows(profileIds: number[]) {
  console.log('\n🌱 Seeding follows with complex social graph...');

  const FOLLOW_PROBABILITY = 0.30; // 30% chance of following
  const PENDING_REQUEST_PROBABILITY = 0.15; // 15% of follows to private accounts will be pending

  let totalFollows = 0;
  let totalPending = 0;

  // Generate follows between all profiles
  for (let i = 0; i < profileIds.length; i++) {
    for (let j = 0; j < profileIds.length; j++) {
      if (i === j) continue; // Don't follow yourself

      // Random chance to follow
      if (Math.random() > FOLLOW_PROBABILITY) continue;

      const followerProfileId = profileIds[i];
      const followingProfileId = profileIds[j];
      const targetIsPrivate = TEST_PROFILES[j].is_private;

      // If target is private, some follows will be pending
      const isPending = targetIsPrivate && Math.random() < PENDING_REQUEST_PROBABILITY;
      const status = isPending ? 'pending' : 'accepted';

      try {
        await execute(
          `INSERT INTO follows (follower_profile_id, following_profile_id, status)
           VALUES (?, ?, ?)`,
          [followerProfileId, followingProfileId, status]
        );

        if (status === 'pending') {
          totalPending++;
        } else {
          totalFollows++;
        }
      } catch (e) {
        // Ignore unique constraint errors
      }
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generated follows for ${i + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalFollows} accepted follows and ${totalPending} pending requests!`);

  // Update followers/following counts
  console.log('\n📊 Updating follow counts...');
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    await execute(
      `UPDATE profiles SET
        followers_count = (
          SELECT COUNT(*) FROM follows
          WHERE following_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'
        ),
        following_count = (
          SELECT COUNT(*) FROM follows
          WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'
        )
      WHERE id = ?`,
      [profileId, profileId, profileId]
    );

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Updated counts for ${i + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log('   ✓ All follow counts updated successfully!');
}

// ============================================================================
// STORIES
// ============================================================================

export async function seedStories(profileIds: number[]) {
  console.log('\n🌱 Seeding stories with extended expiration...');

  const now = new Date();
  // Scadenza lunghissima: 31 dicembre 2030
  const expiresAt = new Date('2030-12-31T23:59:59.000Z');
  const createdAt = now.toISOString();
  const expiresAtStr = expiresAt.toISOString();

  let totalStories = 0;

  // Generate 3-6 stories per profile
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    const numStories = Math.floor(Math.random() * 4) + 3; // 3-6 stories

    for (let j = 0; j < numStories; j++) {
      const mediaUrl = `https://picsum.photos/seed/story${profileId}img${j}/1080/1920`;
      const mediaType = Math.random() < 0.85 ? 'image' : 'video'; // 85% images, 15% videos
      const duration = mediaType === 'image' ? 5 : Math.floor(Math.random() * 21) + 10; // 10-30s for videos

      await execute(
        `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [profileId, mediaUrl, mediaType, duration, createdAt, expiresAtStr]
      );

      totalStories++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generated stories for ${i + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalStories} stories (expiring Dec 31, 2030)!`);
}

// ============================================================================
// POST TAGS
// ============================================================================

export async function seedPostTags(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Seeding post tags...');

  const TAG_PROBABILITY = 0.4; // 40% of posts will have tags
  let totalTags = 0;

  for (const postId of allPostIds) {
    if (Math.random() > TAG_PROBABILITY) continue; // Skip some posts

    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tags per post
    const taggedProfiles = new Set<number>();

    for (let i = 0; i < numTags; i++) {
      const taggedProfileId = profileIds[Math.floor(Math.random() * profileIds.length)];

      // Avoid tagging the same profile twice in one post
      if (taggedProfiles.has(taggedProfileId)) continue;
      taggedProfiles.add(taggedProfileId);

      const xPosition = Math.random();
      const yPosition = Math.random();

      try {
        await execute(
          `INSERT INTO post_tags (post_id, tagged_profile_id, x_position, y_position)
           VALUES (?, ?, ?, ?)`,
          [postId, taggedProfileId, xPosition, yPosition]
        );
        totalTags++;
      } catch (e) {
        // Ignore unique constraint errors
      }
    }
  }

  console.log(`   ✓ Created ${totalTags} post tags successfully!`);
}

