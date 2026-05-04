/**
 * @fileoverview Script di popolamento del database
 *
 * Orchestra il processo di seeding richiamando i vari seeders.
 * Esegui con: pnpm db:seed
 */

import { queryOne } from '@/lib/db';
import { 
  seedUsers, 
  seedProfiles, 
  seedPosts, 
  seedVideoReels,
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
  console.log('\n📦 Instagram Clone - Popolamento Dataset COMPLETO\n');
  console.log('─'.repeat(60) + '\n');
  console.log('Generazione di 80 account con tutte le funzionalità Instagram...');
  console.log('─'.repeat(60));

  try {
    // Controlla se sono già presenti dati
    const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
    if (existingUser) {
      console.log('\n⚠️  Il database contiene già dei dati!');
      console.log('   Esegui prima `pnpm db:reset` per ripartire da zero.\n');
      process.exit(0);
    }

    const startTime = Date.now();

    // Popola i dati rispettando le dipendenze
    console.log('\n🚀 Avvio del processo di seeding completo...\n');
    
    const userIds = await seedUsers();
    const profileIds = await seedProfiles(userIds);
    const allPostIds = await seedPosts(profileIds);
    const reelIds = await seedVideoReels(profileIds);
    const allMediaPostIds = [...allPostIds, ...reelIds];
    
    await seedPostTags(allMediaPostIds, profileIds);
    await seedPostLikes(allMediaPostIds, profileIds);
    await seedSavedPosts(allMediaPostIds, profileIds);
    await seedPostComments(allMediaPostIds, profileIds);
    await seedCommentLikes(profileIds);
    
    await seedFollows(profileIds);
    await seedStories(profileIds);
    await seedStoryViews(profileIds);
    await seedDirectMessages(profileIds);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + '═'.repeat(60));
    console.log('\n🎉 SEEDING COMPLETATO - DATABASE INSTAGRAM CLONE PRONTO!\n');
    console.log('═'.repeat(60));
    console.log(`\n⏱️  Tempo totale: ${duration}s\n`);
    console.log('📊 STATISTICHE DATABASE:');
    console.log('─'.repeat(60));
    console.log(`👥 Utenti: 80 account con foto profilo`);
    console.log(`📝 Post: ${allPostIds.length} post (8-15 per utente)`);
    console.log(`🎬 Reels: ${reelIds.length} video reel (1-3 per utente)`);
    console.log(`❤️  Mi piace: distribuiti fra i contenuti`);
    console.log(`💬 Commenti: più commenti per ogni post`);
    console.log(`🔖 Salvati: raccolte di post preferiti`);
    console.log(`🏷️  Tag: utenti taggati nelle foto`);
    console.log(`📖 Storie: 3-8 per profilo (scadenza a 99 anni!)`);
    console.log(`👁️  Visualizzazioni: tracciamento completo delle views`);
    console.log(`🤝 Follow: grafo sociale con richieste in sospeso`);
    console.log(`💌 Direct: chat con cronologia messaggi`);
    console.log('─'.repeat(60));
    console.log('\n🔑 TUTTI GLI ACCOUNT USANO LA PASSWORD: password123');
    console.log('📅 STORIE IN SCADENZA: 99 anni (perfette per demo!)');
    console.log('\n✨ FUNZIONALITÀ COPERTE:');
    console.log('   • Foto profilo (95% degli utenti)');
    console.log('   • Richieste di follow in sospeso');
    console.log('   • Mi piace su post e commenti');
    console.log('   • Raccolte di post salvati');
    console.log('   • Tag degli utenti nei post');
    console.log('   • Conversazioni in direct');
    console.log('   • Tracciamento visualizzazioni storie');
    console.log('   • Account privati e verificati');
    console.log('   • Post con più media');
    console.log('\n🎯 PRONTO PER DEMO E TEST!\n');
  } catch (error) {
    console.error('\n❌ Seeding fallito:', error);
    console.error('Stack trace:', error);
    process.exit(1);
  }
}

main();
