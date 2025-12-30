/**
 * @fileoverview Database seeding script
 *
 * Orchestrates the seeding process by calling individual seeders.
 * Run with: pnpm db:seed
 */

import { queryOne } from '@/lib/db';
import { seedUsers, seedProfiles, seedPosts, seedFollows, seedStories } from './seeds/seeders';

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
    await seedStories(profileIds);

    console.log('\n' + '─'.repeat(50));
    console.log('\n🎉 Seeding complete!\n');
    console.log('Test accounts created:');
    console.log('  • @johndoe (public, verified) - 6 posts, 3 stories');
    console.log('  • @janedoe (public) - 4 posts, 3 stories');
    console.log('  • @mikeprivate (private) - 0 posts, 0 stories');
    console.log('  • @sarahpublic (public, verified) - 4 posts, 3 stories');
    console.log('\nAll test accounts use password: password123');
    console.log('\nLogin with:');
    console.log('  Email: john@example.com | Username: johndoe');
    console.log('  Email: jane@example.com | Username: janedoe');
    console.log('  Email: mike@example.com | Username: mikeprivate');
    console.log('  Email: sarah@example.com | Username: sarahpublic');
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
