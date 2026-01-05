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
  POST_ASSIGNMENTS,
  STORY_CONFIG,
  MESSAGE_TEMPLATES,
  COMMENT_TEMPLATES,
  LOCATION_TEMPLATES,
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
        profile_image_url, is_private, is_verified,
        followers_count, following_count, posts_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0)`,
      [
        userId,
        profile.username,
        profile.full_name,
        profile.bio,
        profile.website_url,
        profile.profile_image_url,
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
  console.log('\n🌱 Seeding stories with 99-year expiration...');

  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAtStr = STORY_CONFIG.expiresAt;

  let totalStories = 0;

  // Generate 3-8 stories per profile (INCREASED)
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    const numStories = Math.floor(Math.random() * (STORY_CONFIG.storiesPerProfile.max - STORY_CONFIG.storiesPerProfile.min + 1)) + STORY_CONFIG.storiesPerProfile.min;

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

  console.log(`   ✓ Created ${totalStories} stories (expiring in 99 years!)!`);
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

// ============================================================================
// POST LIKES
// ============================================================================

export async function seedPostLikes(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Seeding post likes...');

  const LIKE_PROBABILITY = 0.35; // 35% chance of liking a post
  let totalLikes = 0;
  let skippedPrivate = 0;

  // Load business logic data
  const { queryAll } = await import('@/lib/db');
  
  // Get all posts with their profile info
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Get all accepted follows: Map<follower_id, Set<following_id>>
  const follows = await queryAll<{ follower_profile_id: number; following_profile_id: number }>(
    `SELECT follower_profile_id, following_profile_id 
     FROM follows 
     WHERE status = 'accepted' AND deleted_at IS NULL`
  );
  const followMap = new Map<number, Set<number>>();
  for (const follow of follows) {
    if (!followMap.has(follow.follower_profile_id)) {
      followMap.set(follow.follower_profile_id, new Set());
    }
    followMap.get(follow.follower_profile_id)!.add(follow.following_profile_id);
  }

  for (const profileId of profileIds) {
    const userFollows = followMap.get(profileId) || new Set();
    
    for (const postId of allPostIds) {
      if (Math.random() > LIKE_PROBABILITY) continue;

      const post = postMap.get(postId);
      if (!post) continue;
      
      // Business logic: can only like if profile is public OR you follow them
      const canLike = !post.is_private || userFollows.has(post.profile_id) || post.profile_id === profileId;
      if (!canLike) {
        skippedPrivate++;
        continue;
      }

      try {
        await execute(
          `INSERT INTO likes (profile_id, likeable_type, likeable_id)
           VALUES (?, 'post', ?)`,
          [profileId, postId]
        );
        totalLikes++;

        // Update likes_count on post
        await execute(
          `UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?`,
          [postId]
        );
      } catch (e) {
        // Ignore unique constraint errors
      }
    }

    if ((profileIds.indexOf(profileId) + 1) % 10 === 0) {
      console.log(`   ✓ Generated likes for ${profileIds.indexOf(profileId) + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalLikes} post likes (skipped ${skippedPrivate} private posts)!`);
}

// ============================================================================
// SAVED POSTS
// ============================================================================

export async function seedSavedPosts(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Seeding saved posts...');

  const SAVE_PROBABILITY = 0.015; // 1.5% chance of saving a post (~10 per user)
  let totalSaved = 0;
  let skippedPrivate = 0;

  // Load business logic data
  const { queryAll } = await import('@/lib/db');
  
  // Get all posts with their profile info
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Get all accepted follows
  const follows = await queryAll<{ follower_profile_id: number; following_profile_id: number }>(
    `SELECT follower_profile_id, following_profile_id 
     FROM follows 
     WHERE status = 'accepted' AND deleted_at IS NULL`
  );
  const followMap = new Map<number, Set<number>>();
  for (const follow of follows) {
    if (!followMap.has(follow.follower_profile_id)) {
      followMap.set(follow.follower_profile_id, new Set());
    }
    followMap.get(follow.follower_profile_id)!.add(follow.following_profile_id);
  }

  for (const profileId of profileIds) {
    const userFollows = followMap.get(profileId) || new Set();
    
    for (const postId of allPostIds) {
      if (Math.random() > SAVE_PROBABILITY) continue;

      const post = postMap.get(postId);
      if (!post) continue;
      
      // Business logic: can only save if profile is public OR you follow them
      const canSave = !post.is_private || userFollows.has(post.profile_id) || post.profile_id === profileId;
      if (!canSave) {
        skippedPrivate++;
        continue;
      }

      try {
        await execute(
          `INSERT INTO saved_posts (post_id, profile_id)
           VALUES (?, ?)`,
          [postId, profileId]
        );
        totalSaved++;
      } catch (e) {
        // Ignore unique constraint errors
      }
    }

    if ((profileIds.indexOf(profileId) + 1) % 10 === 0) {
      console.log(`   ✓ Generated saved posts for ${profileIds.indexOf(profileId) + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalSaved} saved posts (skipped ${skippedPrivate} private posts)!`);
}

// ============================================================================
// POST COMMENTS
// ============================================================================

export async function seedPostComments(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Seeding post comments...');

  let totalComments = 0;
  let skippedPrivate = 0;

  // Load business logic data
  const { queryAll } = await import('@/lib/db');
  
  // Get all posts with their profile info
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Get all accepted follows
  const follows = await queryAll<{ follower_profile_id: number; following_profile_id: number }>(
    `SELECT follower_profile_id, following_profile_id 
     FROM follows 
     WHERE status = 'accepted' AND deleted_at IS NULL`
  );
  const followMap = new Map<number, Set<number>>();
  for (const follow of follows) {
    if (!followMap.has(follow.follower_profile_id)) {
      followMap.set(follow.follower_profile_id, new Set());
    }
    followMap.get(follow.follower_profile_id)!.add(follow.following_profile_id);
  }

  for (const postId of allPostIds) {
    const post = postMap.get(postId);
    if (!post) continue;
    
    const numComments = Math.floor(Math.random() * 8); // 0-7 comments per post

    for (let i = 0; i < numComments; i++) {
      const profileId = profileIds[Math.floor(Math.random() * profileIds.length)];
      
      // Business logic: can only comment if profile is public OR you follow them
      const userFollows = followMap.get(profileId) || new Set();
      const canComment = !post.is_private || userFollows.has(post.profile_id) || post.profile_id === profileId;
      if (!canComment) {
        skippedPrivate++;
        continue;
      }
      
      const commentText = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];

      try {
        await execute(
          `INSERT INTO comments (post_id, profile_id, text)
           VALUES (?, ?, ?)`,
          [postId, profileId, commentText]
        );
        totalComments++;

        // Update comments_count on post
        await execute(
          `UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?`,
          [postId]
        );
      } catch (e) {
        // Ignore errors
      }
    }
  }

  console.log(`   ✓ Created ${totalComments} post comments (skipped ${skippedPrivate} attempts on private posts)!`);
}

// ============================================================================
// COMMENT LIKES
// ============================================================================

export async function seedCommentLikes(profileIds: number[]) {
  console.log('\n🌱 Seeding comment likes...');

  const LIKE_COMMENT_PROBABILITY = 0.08; // 8% chance of liking a comment (~15 per user)
  let totalCommentLikes = 0;

  // Get all comment IDs first - must use queryAll
  const { queryAll } = await import('@/lib/db');
  const comments = await queryAll<{ id: number }>('SELECT id FROM comments');
  
  for (const comment of comments) {
    for (const profileId of profileIds) {
      if (Math.random() > LIKE_COMMENT_PROBABILITY) continue;

      try {
        await execute(
          `INSERT INTO likes (profile_id, likeable_type, likeable_id)
           VALUES (?, 'comment', ?)`,
          [profileId, comment.id]
        );
        totalCommentLikes++;

        // Update likes_count on comment
        await execute(
          `UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?`,
          [comment.id]
        );
      } catch (e) {
        // Ignore unique constraint errors
      }
    }
  }

  console.log(`   ✓ Created ${totalCommentLikes} comment likes successfully!`);
}

// ============================================================================
// DIRECT MESSAGES & CHATS
// ============================================================================

export async function seedDirectMessages(profileIds: number[]) {
  console.log('\n🌱 Seeding direct messages and chats...');

  const CHAT_PROBABILITY = 0.20; // 20% chance of having a chat with another user
  let totalChats = 0;
  let totalMessages = 0;

  for (let i = 0; i < profileIds.length; i++) {
    for (let j = i + 1; j < profileIds.length; j++) {
      if (Math.random() > CHAT_PROBABILITY) continue;

      const profile1Id = profileIds[i];
      const profile2Id = profileIds[j];

      // Create chat
      const chatResult = await execute(
        `INSERT INTO chats (created_at) VALUES (datetime('now'))`,
        []
      );
      const chatId = chatResult.lastID;
      totalChats++;

      // Add both participants
      await execute(
        `INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)`,
        [chatId, profile1Id]
      );
      await execute(
        `INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)`,
        [chatId, profile2Id]
      );

      // Add 3-10 messages to the chat
      const numMessages = Math.floor(Math.random() * 8) + 3;
      for (let k = 0; k < numMessages; k++) {
        const senderId = Math.random() < 0.5 ? profile1Id : profile2Id;
        const messageText = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];

        await execute(
          `INSERT INTO messages (chat_id, sender_profile_id, text)
           VALUES (?, ?, ?)`,
          [chatId, senderId, messageText]
        );
        totalMessages++;
      }
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generated chats for ${i + 1}/${profileIds.length} profiles...`);
    }
  }

  console.log(`   ✓ Created ${totalChats} chats with ${totalMessages} messages successfully!`);
}

// ============================================================================
// STORY VIEWS
// ============================================================================

export async function seedStoryViews(profileIds: number[]) {
  console.log('\n🌱 Seeding story views...');

  const VIEW_PROBABILITY = 0.40; // 40% chance of viewing a story
  let totalViews = 0;
  let skippedNotFollowing = 0;

  // Get all story IDs
  const { queryAll } = await import('@/lib/db');
  const stories = await queryAll<{ id: number; profile_id: number }>('SELECT id, profile_id FROM stories');
  
  // Get all accepted follows - stories are only visible to followers
  const follows = await queryAll<{ follower_profile_id: number; following_profile_id: number }>(
    `SELECT follower_profile_id, following_profile_id 
     FROM follows 
     WHERE status = 'accepted' AND deleted_at IS NULL`
  );
  const followMap = new Map<number, Set<number>>();
  for (const follow of follows) {
    if (!followMap.has(follow.follower_profile_id)) {
      followMap.set(follow.follower_profile_id, new Set());
    }
    followMap.get(follow.follower_profile_id)!.add(follow.following_profile_id);
  }

  for (const story of stories) {
    for (const profileId of profileIds) {
      // Can view own stories
      if (story.profile_id === profileId) {
        if (Math.random() < 0.3) continue; // 30% chance to skip own story
      } else {
        // Business logic: can only view stories from profiles you follow
        const userFollows = followMap.get(profileId) || new Set();
        if (!userFollows.has(story.profile_id)) {
          skippedNotFollowing++;
          continue;
        }
      }
      
      if (Math.random() > VIEW_PROBABILITY) continue;

      try {
        await execute(
          `INSERT INTO story_views (story_id, viewer_profile_id)
           VALUES (?, ?)`,
          [story.id, profileId]
        );
        totalViews++;
        
        // Update views_count on story
        await execute(
          `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
          [story.id]
        );
      } catch (e) {
        // Ignore unique constraint errors
      }
    }
  }

  console.log(`   ✓ Created ${totalViews} story views (skipped ${skippedNotFollowing} from non-followed profiles)!`);
}

