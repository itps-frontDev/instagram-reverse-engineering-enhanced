/**
 * @fileoverview Database seeding script
 *
 * Orchestrates the seeding process by calling individual seeders.
 * Run with: pnpm db:seed
 */

import { queryOne } from '@/lib/db';
import { seedUsers, seedProfiles, seedPosts, seedFollows, seedStories, seedPostTags } from './seeds/seeders';

async function main() {
  console.log('\n📦 Instagram Clone - Large Dataset Seeding\n');
  console.log('─'.repeat(60) + '\n');
  console.log('Generating 55 accounts with comprehensive data...');
  console.log('─'.repeat(60));

  try {
    // Check if data already exists
    const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
    if (existingUser) {
      console.log('\n⚠️  Database already contains data!');
      console.log('   Run `pnpm db:reset` first to clear existing data.\n');
      process.exit(0);
    }

    const startTime = Date.now();

    // Seed data
    const userIds = await seedUsers();
    const profileIds = await seedProfiles(userIds);
    const allPostIds = await seedPosts(profileIds);
    await seedPostTags(allPostIds, profileIds);
    await seedFollows(profileIds);
    await seedStories(profileIds);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '─'.repeat(60));
    console.log('\n🎉 Seeding complete!\n');
    console.log(`⏱️  Total time: ${duration}s`);
    console.log(`👥 Created: 55 accounts with diverse profiles`);
    console.log(`📝 Posts: ${allPostIds.length} total with multiple images`);
    console.log(`🏷️  Tags: Post tags for testing tagged section`);
    console.log(`📖 Stories: 3-6 per profile (expiring Dec 31, 2030)`);
    console.log(`🤝 Follows: Complex social graph with pending requests`);
    console.log('\n💡 All accounts use password: password123');
    console.log('📅 Stories expire on: December 31, 2030');
    console.log('\n✨ Sample accounts to try:');
    console.log('   Browse profiles to see the rich dataset!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
