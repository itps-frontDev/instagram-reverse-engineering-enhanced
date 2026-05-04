// ============================================================================
// POST
// ============================================================================

export async function seedPosts(profileIds: number[]) {
  console.log('\n🌱 Popolamento dei post...');

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
      const likesCount = Math.floor(Math.random() * 491) + 10; // 10-500 mi piace simulati
      const commentsCount = Math.floor(Math.random() * 51); // 0-50 commenti simulati
      const hasMultipleMedia = Math.random() < 0.3; // 30% di probabilità di avere più media
      const mediaCount = hasMultipleMedia ? Math.floor(Math.random() * 4) + 2 : 1; // 2-5 immagini oppure 1

      const result = await execute(
        `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
         VALUES (?, ?, ?, ?)`,
        [profileId, caption, likesCount, commentsCount]
      );

      const postId = result.lastID;
      allPostIds.push(postId);

      // Aggiunge i media associati al post
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

    // Aggiorna il posts_count del profilo
    await execute(
      'UPDATE profiles SET posts_count = ? WHERE id = ?',
      [numPosts, profileId]
    );

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generati post per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Creati ${totalPosts} post con successo!`);

  return allPostIds; // IDs dei post utili per i tag successivi
}

// ============================================================================
// VIDEO REEL
// ============================================================================

export async function seedVideoReels(profileIds: number[]) {
  console.log('\n🌱 Popolamento dei video reel...');

  const REEL_CAPTIONS = [
    '🎬 Check this out!',
    'POV: Living my best life ✨',
    'This is everything 🔥',
    'Wait for it... 😱',
    'Caught on camera 📹',
    'Vibes only 🌟',
    'No way this happened! 😂',
    'Golden hour magic ☀️',
    'Behind the scenes 🎭',
    'Making memories 💫',
    'This view though 😍',
    'Adventure mode: ON 🗺️',
    'Life update 📱',
    'Mood 💯',
    'Can\'t stop watching this',
    'A message from the matchwinner 🏆',
    'Best day ever! 🙌',
    'Saturday vibes 🎉',
    'This is art 🎨',
    'Pure happiness 💙',
  ];

  // URL di esempio per i video (fonti pubbliche di test)
  const VIDEO_URLS = [
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  ];

  let totalReels = 0;
  const allReelIds: number[] = [];
  const TARGET_REELS = 20; // Creiamo solo 20 reel in totale

  // Solo una parte degli utenti riceve un reel video
  const selectedProfiles = profileIds.slice(0, TARGET_REELS);
  for (let i = 0; i < selectedProfiles.length; i++) {
    const profileId = selectedProfiles[i];
    const numReels = 1; // 1 reel per ogni profilo selezionato

    for (let j = 0; j < numReels; j++) {
      const caption = REEL_CAPTIONS[Math.floor(Math.random() * REEL_CAPTIONS.length)];
      const likesCount = Math.floor(Math.random() * 100000) + 1000; // 1K-100K mi piace
      const commentsCount = Math.floor(Math.random() * 1000) + 50; // 50-1000 commenti
      const videoUrl = VIDEO_URLS[Math.floor(Math.random() * VIDEO_URLS.length)];
      const duration = Math.floor(Math.random() * 55) + 5; // 5-60 secondi

      const result = await execute(
        `INSERT INTO posts (profile_id, caption, likes_count, comments_count)
         VALUES (?, ?, ?, ?)`,
        [profileId, caption, likesCount, commentsCount]
      );

      const postId = result.lastID;
      allReelIds.push(postId);

      // Aggiunge il media video per il reel
      await execute(
        `INSERT INTO post_media (post_id, media_url, media_type, duration_seconds, position)
         VALUES (?, ?, 'video', ?, 0)`,
        [postId, videoUrl, duration]
      );

      totalReels++;
    }

    // Aggiorna il posts_count del profilo
    await execute(
      `UPDATE profiles SET posts_count = posts_count + (
        SELECT COUNT(*) FROM posts WHERE profile_id = ? AND deleted_at IS NULL
      ) - posts_count WHERE id = ?`,
      [profileId, profileId]
    );

    if ((i + 1) % 20 === 0) {
      console.log(`   ✓ Generati reel per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Creati ${totalReels} video reel con successo!`);

  return allReelIds;
}

/**
 * @fileoverview Funzioni di seeding
 *
 * Contiene tutta la logica di popolamento organizzata per entità.
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
// UTENTI
// ============================================================================

export async function seedUsers() {
  console.log('🌱 Popolamento degli utenti...');

  const userIds: number[] = [];

  for (const user of TEST_USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);

    const result = await execute(
      `INSERT INTO users (email, phone_number, password_hash, date_of_birth, is_email_verified)
       VALUES (?, ?, ?, ?, 1)`,
      [user.email, user.phone_number, password_hash, user.date_of_birth]
    );

    userIds.push(result.lastID);
    console.log(`   ✓ Creato utente: ${user.email} (ID: ${result.lastID})`);
  }

  return userIds;
}

// ============================================================================
// PROFILI
// ============================================================================

export async function seedProfiles(userIds: number[]) {
  console.log('\n🌱 Popolamento dei profili...');

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
// FOLLOW
// ============================================================================

export async function seedFollows(profileIds: number[]) {
  console.log('\n🌱 Popolamento dei follow con grafo sociale realistico...');

  const FOLLOW_PROBABILITY = 0.30; // 30% di probabilità di seguire
  const PENDING_REQUEST_PROBABILITY = 0.15; // 15% dei follow verso privati rimane in sospeso

  let totalFollows = 0;
  let totalPending = 0;

  // Genera follow fra tutti i profili
  for (let i = 0; i < profileIds.length; i++) {
    for (let j = 0; j < profileIds.length; j++) {
      if (i === j) continue; // Evita di seguire se stessi

      // Probabilità casuale di seguire
      if (Math.random() > FOLLOW_PROBABILITY) continue;

      const followerProfileId = profileIds[i];
      const followingProfileId = profileIds[j];
      const targetIsPrivate = TEST_PROFILES[j].is_private;

      // Se il profilo è privato, parte delle richieste rimane pending
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
        // Ignora gli errori di vincolo unico
      }
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Generati follow per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Creati ${totalFollows} follow accettati e ${totalPending} richieste in sospeso!`);

  // Aggiorna i contatori di follower/following
  console.log('\n📊 Aggiornamento dei contatori follow...');
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
      console.log(`   ✓ Aggiornati i conteggi per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log('   ✓ Tutti i contatori follow aggiornati!');
}

// ============================================================================
// STORIE
// ============================================================================

export async function seedStories(profileIds: number[]) {
  console.log('\n🌱 Popolamento delle storie con scadenza a 99 anni...');

  const now = new Date();
  const createdAt = now.toISOString();
  const expiresAtStr = STORY_CONFIG.expiresAt;

  let totalStories = 0;

  // Genera 3-8 storie per profilo (valori aumentati)
  for (let i = 0; i < profileIds.length; i++) {
    const profileId = profileIds[i];
    const username = TEST_PROFILES[i]?.username ?? `user${i}`;
    const numStories = Math.floor(Math.random() * (STORY_CONFIG.storiesPerProfile.max - STORY_CONFIG.storiesPerProfile.min + 1)) + STORY_CONFIG.storiesPerProfile.min;

    for (let j = 0; j < numStories; j++) {
      const mediaUrl = `https://picsum.photos/seed/story${profileId}img${j}/1080/1920`;
      const mediaType = 'image'; // Tutte immagini dato l'uso di picsum.photos
      const duration = 5; // 5 secondi per ogni immagine

      await execute(
        `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [profileId, mediaUrl, mediaType, duration, createdAt, expiresAtStr]
      );

      totalStories++;
    }

    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Storie generate per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Create ${totalStories} storie (scadenza fra 99 anni!)!`);
}

// ============================================================================
// TAG DEI POST
// ============================================================================

export async function seedPostTags(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Popolamento dei tag sui post...');

  const TAG_PROBABILITY = 0.4; // Il 40% dei post avrà dei tag
  let totalTags = 0;

  for (const postId of allPostIds) {
    if (Math.random() > TAG_PROBABILITY) continue; // Salta alcuni post

    const numTags = Math.floor(Math.random() * 3) + 1; // 1-3 tag per post
    const taggedProfiles = new Set<number>();

    for (let i = 0; i < numTags; i++) {
      const taggedProfileId = profileIds[Math.floor(Math.random() * profileIds.length)];

      // Evita di taggare lo stesso profilo due volte nello stesso post
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
        // Ignora gli errori di vincolo unico
      }
    }
  }

  console.log(`   ✓ Creati ${totalTags} tag sui post con successo!`);
}

// ============================================================================
// MI PIACE AI POST
// ============================================================================

export async function seedPostLikes(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Popolamento dei mi piace ai post...');

  const LIKE_PROBABILITY = 0.35; // 35% di probabilità di mettere mi piace
  let totalLikes = 0;
  let skippedPrivate = 0;

  // Recupera i dati necessari alla logica
  const { queryAll } = await import('@/lib/db');
  
  // Recupera tutti i post con le info del profilo
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Recupera tutti i follow accettati: Map<follower_id, Set<following_id>>
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
      
      // Logica: puoi mettere mi piace solo se il profilo è pubblico o lo segui
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

        // Aggiorna il likes_count del post
        await execute(
          `UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?`,
          [postId]
        );
      } catch (e) {
        // Ignora gli errori di vincolo unico
      }
    }

    if ((profileIds.indexOf(profileId) + 1) % 10 === 0) {
      console.log(`   ✓ Generati mi piace per ${profileIds.indexOf(profileId) + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Creati ${totalLikes} mi piace sui post (saltati ${skippedPrivate} post privati)!`);
}

// ============================================================================
// POST SALVATI
// ============================================================================

export async function seedSavedPosts(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Popolamento dei post salvati...');

  const SAVE_PROBABILITY = 0.015; // 1,5% di probabilità di salvare un post (~10 per utente)
  let totalSaved = 0;
  let skippedPrivate = 0;

  // Recupera i dati necessari alla logica
  const { queryAll } = await import('@/lib/db');
  
  // Recupera tutti i post con le info del profilo
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Recupera tutti i follow accettati
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
      
      // Logica: puoi salvare solo se il profilo è pubblico o lo segui
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
        // Ignora gli errori di vincolo unico
      }
    }

    if ((profileIds.indexOf(profileId) + 1) % 10 === 0) {
      console.log(`   ✓ Generati post salvati per ${profileIds.indexOf(profileId) + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Creati ${totalSaved} post salvati (saltati ${skippedPrivate} post privati)!`);
}

// ============================================================================
// COMMENTI AI POST
// ============================================================================

export async function seedPostComments(allPostIds: number[], profileIds: number[]) {
  console.log('\n🌱 Popolamento dei commenti ai post...');

  let totalComments = 0;
  let skippedPrivate = 0;

  // Recupera i dati necessari alla logica
  const { queryAll } = await import('@/lib/db');
  
  // Recupera tutti i post con le info del profilo
  const posts = await queryAll<{ id: number; profile_id: number; is_private: number }>(
    `SELECT p.id, p.profile_id, pr.is_private 
     FROM posts p 
     JOIN profiles pr ON p.profile_id = pr.id`
  );
  const postMap = new Map(posts.map(p => [p.id, p]));
  
  // Recupera tutti i follow accettati
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
    
    const numComments = Math.floor(Math.random() * 8); // 0-7 commenti per post

    for (let i = 0; i < numComments; i++) {
      const profileId = profileIds[Math.floor(Math.random() * profileIds.length)];
      
      // Logica: puoi commentare solo se il profilo è pubblico o lo segui
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

        // Aggiorna il comments_count del post
        await execute(
          `UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?`,
          [postId]
        );
      } catch (e) {
        // Ignora gli errori
      }
    }
  }

  console.log(`   ✓ Creati ${totalComments} commenti ai post (saltati ${skippedPrivate} tentativi su profili privati)!`);
}

// ============================================================================
// MI PIACE AI COMMENTI
// ============================================================================

export async function seedCommentLikes(profileIds: number[]) {
  console.log('\n🌱 Popolamento dei mi piace ai commenti...');

  const LIKE_COMMENT_PROBABILITY = 0.08; // 8% di probabilità di mettere mi piace (~15 per utente)
  let totalCommentLikes = 0;

  // Recupera tutti gli ID dei commenti usando queryAll
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

        // Aggiorna il likes_count del commento
        await execute(
          `UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?`,
          [comment.id]
        );
      } catch (e) {
        // Ignora gli errori di vincolo unico
      }
    }
  }

  console.log(`   ✓ Creati ${totalCommentLikes} mi piace sui commenti con successo!`);
}

// ============================================================================
// DIRECT E CHAT
// ============================================================================

export async function seedDirectMessages(profileIds: number[]) {
  console.log('\n🌱 Popolamento dei direct e delle chat...');

  const CHAT_PROBABILITY = 0.20; // 20% di probabilità di avviare una chat con un altro utente
  let totalChats = 0;
  let totalMessages = 0;

  for (let i = 0; i < profileIds.length; i++) {
    for (let j = i + 1; j < profileIds.length; j++) {
      if (Math.random() > CHAT_PROBABILITY) continue;

      const profile1Id = profileIds[i];
      const profile2Id = profileIds[j];

      // Crea la chat
      const chatResult = await execute(
        `INSERT INTO chats (created_at) VALUES (datetime('now'))`,
        []
      );
      const chatId = chatResult.lastID;
      totalChats++;

      // Aggiunge entrambi i partecipanti
      await execute(
        `INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)`,
        [chatId, profile1Id]
      );
      await execute(
        `INSERT INTO chat_participants (chat_id, profile_id) VALUES (?, ?)`,
        [chatId, profile2Id]
      );

      // Inserisce da 3 a 10 messaggi nella chat
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
      console.log(`   ✓ Conversazioni generate per ${i + 1}/${profileIds.length} profili...`);
    }
  }

  console.log(`   ✓ Create ${totalChats} chat con ${totalMessages} messaggi complessivi!`);
}

// ============================================================================
// VISUALIZZAZIONI STORIE
// ============================================================================

export async function seedStoryViews(profileIds: number[]) {
  console.log('\n🌱 Popolamento delle visualizzazioni delle storie...');

  const VIEW_PROBABILITY = 0.40; // 40% di probabilità di visualizzare una storia
  let totalViews = 0;
  let skippedNotFollowing = 0;

  // Recupera tutte le storie
  const { queryAll } = await import('@/lib/db');
  const stories = await queryAll<{ id: number; profile_id: number }>('SELECT id, profile_id FROM stories');
  
  // Recupera tutti i follow accettati: le storie sono disponibili solo ai follower
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
      // Un profilo può sempre vedere le proprie storie
      if (story.profile_id === profileId) {
        if (Math.random() < 0.3) continue; // 30% di probabilità di non guardare la propria storia
      } else {
        // Logica: puoi vedere storie solo dai profili che segui
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
        
        // Aggiorna il views_count della storia
        await execute(
          `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
          [story.id]
        );
      } catch (e) {
        // Ignora gli errori di vincolo unico
      }
    }
  }

  console.log(`   ✓ Registrate ${totalViews} visualizzazioni storie (saltati ${skippedNotFollowing} profili non seguiti)!`);
}

