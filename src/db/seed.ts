/**
 * @fileoverview Database seeding script
 *
 * Orchestrates the seeding process by calling individual seeders.
 * Run with: pnpm db:seed
 */

import { queryOne } from '@/lib/db';
import { 
  seedUsers, 
  seedProfiles, 
  seedPosts, 
  seedFollows, 
  seedStories, 
  seedPostTags,
  seedPostLikes,
  seedSavedPosts,
  seedPostComments,
  seedCommentLikes,
  seedDirectMessages,
  seedStoryViews,
} from './seeds/seeders';

async function main() {
  console.log('\n📦 Instagram Clone - COMPREHENSIVE Dataset Seeding\n');
  console.log('─'.repeat(60) + '\n');
  console.log('Generating 80 accounts with FULL Instagram features...');
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

    // Seed data in order (dependencies matter!)
    console.log('\n🚀 Starting comprehensive seeding process...\n');
    
    const userIds = await seedUsers();
    const profileIds = await seedProfiles(userIds);
    const allPostIds = await seedPosts(profileIds);
    
    await seedPostTags(allPostIds, profileIds);
    await seedPostLikes(allPostIds, profileIds);
    await seedSavedPosts(allPostIds, profileIds);
    await seedPostComments(allPostIds, profileIds);
    await seedCommentLikes(profileIds);
    
    await seedFollows(profileIds);
    await seedStories(profileIds);
    await seedStoryViews(profileIds);
    await seedDirectMessages(profileIds);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 SEEDING COMPLETE - FULL INSTAGRAM CLONE DATABASE!\n');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Total time: ${duration}s\n`);
    console.log('📊 DATABASE STATISTICS:');
    console.log('─'.repeat(60));
    console.log(`👥 Users: 80 accounts with profile pictures`);
    console.log(`📝 Posts: ${allPostIds.length} posts (8-15 per user)`);
    console.log(`❤️  Likes: Distributed across posts`);
    console.log(`💬 Comments: Multiple comments per post`);
    console.log(`🔖 Saved Posts: Users saving their favorite content`);
    console.log(`🏷️  Tagged: Users tagged in photos`);
    console.log(`📖 Stories: 3-8 per profile (99-year expiration!)`);
    console.log(`👁️  Story Views: Comprehensive view tracking`);
    console.log(`🤝 Follows: Complex social graph + pending requests`);
    console.log(`💌 Direct Messages: Chats with message history`);
    console.log('─'.repeat(60));
    console.log('\n🔑 ALL ACCOUNTS USE PASSWORD: password123');
    console.log('📅 STORIES EXPIRE IN: 99 years (perfect for demos!)');
    console.log('\n✨ FEATURES INCLUDED:');
    console.log('   • Profile pictures (95% of users)');
    console.log('   • Pending follow requests');
    console.log('   • Post likes & comment likes');
    console.log('   • Saved posts collections');
    console.log('   • Tagged users in posts');
    console.log('   • Direct message conversations');
    console.log('   • Story views tracking');
    console.log('   • Private & verified accounts');
    console.log('   • Multiple images per post');
    console.log('\n🎯 READY FOR DEMO & TESTING!\n');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    console.error('Stack trace:', error);
    process.exit(1);
  }
}

main();
