/**
 * @fileoverview Database seeding script
 *
 * Populates the database with test data for profiles, posts, and follows.
 */

import { execute, queryOne } from '@/lib/db';

// ============================================================================
// SEED DATA
// ============================================================================

const TEST_USERS = [
  {
    email: 'john@example.com',
    phone_number: '+1234567890',
    password_hash: 'hashed_password_1',
    date_of_birth: '1990-01-15',
  },
  {
    email: 'jane@example.com',
    phone_number: '+1234567891',
    password_hash: 'hashed_password_2',
    date_of_birth: '1992-05-20',
  },
  {
    email: 'mike@example.com',
    phone_number: '+1234567892',
    password_hash: 'hashed_password_3',
    date_of_birth: '1988-11-10',
  },
  {
    email: 'sarah@example.com',
    phone_number: '+1234567893',
    password_hash: 'hashed_password_4',
    date_of_birth: '1995-03-25',
  },
];

const TEST_PROFILES = [
  {
    username: 'johndoe',
    full_name: 'John Doe',
    bio: 'Photography enthusiast 📸\nTravel lover ✈️\n@janedoe is my best friend',
    website_url: 'https://johndoe.com',
    is_private: false,
    is_verified: true,
  },
  {
    username: 'janedoe',
    full_name: 'Jane Doe',
    bio: 'Digital artist 🎨\nCreating magic every day\n#art #design',
    website_url: 'https://janedoe.art',
    is_private: false,
    is_verified: false,
  },
  {
    username: 'mikeprivate',
    full_name: 'Mike Private',
    bio: 'Private account 🔒\nFollow to see my posts',
    website_url: null,
    is_private: true,
    is_verified: false,
  },
  {
    username: 'sarahpublic',
    full_name: 'Sarah Public',
    bio: 'Fitness coach 💪\nHealthy lifestyle advocate\nDM for coaching',
    website_url: 'https://sarahfitness.com',
    is_private: false,
    is_verified: true,
  },
];

const TEST_POSTS = [
  // John's posts
  { caption: 'Beautiful sunset 🌅', likes: 142, comments: 12 },
  { caption: 'Coffee time ☕', likes: 89, comments: 5 },
  { caption: 'New camera! 📷', likes: 234, comments: 18 },
  { caption: 'City lights at night', likes: 167, comments: 9 },
  { caption: 'Weekend vibes', likes: 201, comments: 15 },
  { caption: 'Mountain hiking 🏔️', likes: 312, comments: 24 },

  // Jane's posts
  { caption: 'Latest artwork 🎨', likes: 456, comments: 32 },
  { caption: 'Work in progress...', likes: 298, comments: 19 },
  { caption: 'Color palette inspiration', likes: 187, comments: 11 },
  { caption: 'Digital painting tutorial', likes: 523, comments: 45 },

  // Sarah's posts
  { caption: 'Morning workout routine 💪', likes: 678, comments: 41 },
  { caption: 'Meal prep Sunday!', likes: 445, comments: 28 },
  { caption: 'Transformation Tuesday', likes: 892, comments: 67 },
  { caption: 'Fitness tips for beginners', likes: 756, comments: 53 },
];

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

async function seedUsers() {
  console.log('🌱 Seeding users...');

  const userIds: number[] = [];

  for (const user of TEST_USERS) {
    const result = await execute(
      `INSERT INTO users (email, phone_number, password_hash, date_of_birth, is_email_verified)
       VALUES (?, ?, ?, ?, 1)`,
      [user.email, user.phone_number, user.password_hash, user.date_of_birth]
    );
    userIds.push(result.lastID);
    console.log(`   ✓ Created user: ${user.email} (ID: ${result.lastID})`);
  }

  return userIds;
}

async function seedProfiles(userIds: number[]) {
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

async function seedPosts(profileIds: number[]) {
  console.log('\n🌱 Seeding posts...');

  let postIndex = 0;

  // John's posts (6 posts)
  for (let i = 0; i < 6; i++) {
    const post = TEST_POSTS[postIndex++];
    const result = await execute(
      `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
       VALUES (?, ?, ?, ?)`,
      [profileIds[0], post.caption, post.likes, post.comments]
    );

    // Add dummy media
    await execute(
      `INSERT INTO post_media (post_id, media_url, media_type, position)
       VALUES (?, ?, 'image', 0)`,
      [result.lastID, `https://picsum.photos/seed/post${result.lastID}/1080/1350`]
    );

    console.log(`   ✓ Created post: "${post.caption}" for @johndoe`);
  }

  // Update John's posts_count
  await execute(
    'UPDATE profiles SET posts_count = 6 WHERE id = ?',
    [profileIds[0]]
  );

  // Jane's posts (4 posts)
  for (let i = 0; i < 4; i++) {
    const post = TEST_POSTS[postIndex++];
    const result = await execute(
      `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
       VALUES (?, ?, ?, ?)`,
      [profileIds[1], post.caption, post.likes, post.comments]
    );

    await execute(
      `INSERT INTO post_media (post_id, media_url, media_type, position)
       VALUES (?, ?, 'image', 0)`,
      [result.lastID, `https://picsum.photos/seed/art${result.lastID}/1080/1350`]
    );

    console.log(`   ✓ Created post: "${post.caption}" for @janedoe`);
  }

  // Update Jane's posts_count
  await execute(
    'UPDATE profiles SET posts_count = 4 WHERE id = ?',
    [profileIds[1]]
  );

  // Sarah's posts (4 posts)
  for (let i = 0; i < 4; i++) {
    const post = TEST_POSTS[postIndex++];
    const result = await execute(
      `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
       VALUES (?, ?, ?, ?)`,
      [profileIds[3], post.caption, post.likes, post.comments]
    );

    await execute(
      `INSERT INTO post_media (post_id, media_url, media_type, position)
       VALUES (?, ?, 'image', 0)`,
      [result.lastID, `https://picsum.photos/seed/fitness${result.lastID}/1080/1350`]
    );

    console.log(`   ✓ Created post: "${post.caption}" for @sarahpublic`);
  }

  // Update Sarah's posts_count
  await execute(
    'UPDATE profiles SET posts_count = 4 WHERE id = ?',
    [profileIds[3]]
  );
}

async function seedFollows(profileIds: number[]) {
  console.log('\n🌱 Seeding follows...');

  // John follows Jane (accepted)
  await execute(
    `INSERT INTO follows (follower_profile_id, following_profile_id, status)
     VALUES (?, ?, 'accepted')`,
    [profileIds[0], profileIds[1]]
  );
  console.log('   ✓ @johndoe follows @janedoe');

  // Jane follows John (accepted)
  await execute(
    `INSERT INTO follows (follower_profile_id, following_profile_id, status)
     VALUES (?, ?, 'accepted')`,
    [profileIds[1], profileIds[0]]
  );
  console.log('   ✓ @janedoe follows @johndoe');

  // John follows Sarah (accepted)
  await execute(
    `INSERT INTO follows (follower_profile_id, following_profile_id, status)
     VALUES (?, ?, 'accepted')`,
    [profileIds[0], profileIds[3]]
  );
  console.log('   ✓ @johndoe follows @sarahpublic');

  // Jane sent request to Mike (pending - private account)
  await execute(
    `INSERT INTO follows (follower_profile_id, following_profile_id, status)
     VALUES (?, ?, 'pending')`,
    [profileIds[1], profileIds[2]]
  );
  console.log('   ✓ @janedoe sent follow request to @mikeprivate (pending)');

  // Update followers/following counts
  await execute(
    `UPDATE profiles SET followers_count = 1, following_count = 2 WHERE id = ?`,
    [profileIds[0]] // John
  );
  await execute(
    `UPDATE profiles SET followers_count = 1, following_count = 2 WHERE id = ?`,
    [profileIds[1]] // Jane
  );
  await execute(
    `UPDATE profiles SET followers_count = 0, following_count = 0 WHERE id = ?`,
    [profileIds[2]] // Mike (pending doesn't count)
  );
  await execute(
    `UPDATE profiles SET followers_count = 1, following_count = 0 WHERE id = ?`,
    [profileIds[3]] // Sarah
  );
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('\n📦 Instagram Clone - Database Seeding\n');
  console.log('─'.repeat(50) + '\n');

  try {
    // Check if data already exists
    const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
    if (existingUser) {
      console.log('⚠️  Database already contains data!');
      console.log('   Run `pnpm db:reset` first to clear existing data.\n');
      process.exit(0);
    }

    // Seed data
    const userIds = await seedUsers();
    const profileIds = await seedProfiles(userIds);
    await seedPosts(profileIds);
    await seedFollows(profileIds);

    console.log('\n' + '─'.repeat(50));
    console.log('\n🎉 Seeding complete!\n');
    console.log('Test accounts created:');
    console.log('  • @johndoe (public, verified) - 6 posts');
    console.log('  • @janedoe (public) - 4 posts');
    console.log('  • @mikeprivate (private) - 0 posts');
    console.log('  • @sarahpublic (public, verified) - 4 posts');
    console.log('\nTest with mock auth:');
    console.log('  document.cookie = "mock_user_id=1; path=/";  // Login as John');
    console.log('  document.cookie = "mock_user_id=2; path=/";  // Login as Jane');
    console.log('\nVisit profiles:');
    console.log('  http://localhost:3000/profile/johndoe');
    console.log('  http://localhost:3000/profile/janedoe');
    console.log('  http://localhost:3000/profile/mikeprivate');
    console.log('  http://localhost:3000/profile/sarahpublic\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
