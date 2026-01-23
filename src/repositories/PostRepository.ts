/**
 * @fileoverview Post Repository (Repository Pattern)
 * 
 * Gestisce tutte le operazioni database relative ai post.
 * Include gestione media, like e salvataggi.
 * 
 * STRUTTURA DATABASE CORRELATA:
 * - posts: dati del post (caption, profile_id, contatori)
 * - post_media: media associati al post (immagini, video)
 * - likes: relazioni like utente-post
 * - saved_posts: post salvati dagli utenti
 * 
 * NOTA: I commenti sono gestiti da CommentRepository.
 * 
 * @module repositories/PostRepository
 * 
 * @example
 * import { postRepository } from '@/repositories';
 * 
 * // Ottieni post per ID
 * const post = await postRepository.findById(123);
 * 
 * // Ottieni feed utente
 * const feed = await postRepository.getFeed(profileId, 20, 0);
 * 
 * // Metti like a un post
 * await postRepository.like(postId, profileId);
 */

import { queryOne, queryAll, execute } from '@/lib/db';

// ============================================================================
// TIPI
// ============================================================================

/**
 * Post base dal database.
 */
export interface Post {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  likes_count: number;
  comments_count: number;
  is_pinned: boolean;
  comments_disabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Post con informazioni del profilo autore.
 * Usato nelle liste e nel feed.
 */
export interface PostWithProfile extends Post {
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

/**
 * Media di un post (immagine o video).
 */
export interface PostMedia {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
}

/**
 * Dati per creare un nuovo post.
 */
export interface CreatePostData {
  profile_id: number;
  caption?: string;
  location?: string;
  comments_disabled?: boolean;
  is_likes_hidden?: boolean;
}

/**
 * Dati per aggiornare un post.
 */
export interface UpdatePostData {
  caption?: string;
  location?: string;
  comments_disabled?: boolean;
  is_pinned?: boolean;
}

/**
 * Dati per aggiungere un media al post.
 */
export interface AddMediaData {
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds?: number;
  position: number;
}

/**
 * Post del feed con tutti i dettagli per la visualizzazione.
 * Include flag di interazione (like, save, follow) e stato storie.
 * Ritornato da getFeedWithDetails().
 */
export interface FeedPostWithDetails {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: number;
  is_likes_hidden: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: number;
  profile_is_private: number;
  profile_has_active_story: number;
  profile_has_viewed_story: number;
  is_liked: number | null;
  is_saved: number | null;
  is_following: number | null;
}

/**
 * Post del feed formattato per l'API.
 * Converte i campi INTEGER del DB in boolean TypeScript.
 * Ritornato da convertFeedPostForAPI().
 */
export interface FeedPostForAPI {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  profile_has_active_story: boolean;
  profile_has_viewed_story: boolean;
  profile_is_private: boolean;
  media: PostMedia[];
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
  is_following_author: boolean;
}

/**
 * Reel dal database con campi INTEGER.
 * Ritornato da getReels().
 */
export interface ReelWithDetails {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  is_liked: boolean;
  is_saved: boolean;
}

/**
 * Post singolo con dettagli viewer (like/save status).
 * Ritornato da findByIdForView().
 */
export interface PostForView {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  profile_is_private: boolean;
  is_liked: boolean;
  is_saved: boolean;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per le operazioni sui post.
 * Centralizza tutte le query relative a posts, media, like e salvataggi.
 * 
 * NOTA: I commenti sono gestiti da CommentRepository.
 */
export const postRepository = {
  // ==========================================================================
  // OPERAZIONI CRUD POST
  // ==========================================================================

  /**
   * Trova un post per ID.
   * 
   * @param id - ID del post
   * @returns Post trovato o null
   */
  async findById(id: number): Promise<Post | null> {
    const post = await queryOne<Post>(
      `SELECT
        id, profile_id, caption, location,
        likes_count, comments_count,
        created_at, updated_at
       FROM posts
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    
    return post || null;
  },

  /**
   * Trova un post con le informazioni del profilo autore.
   * Usa JOIN per ottenere username, immagine profilo, etc.
   * 
   * @param id - ID del post
   * @returns Post con profilo o null
   */
  async findByIdWithProfile(id: number): Promise<PostWithProfile | null> {
    const post = await queryOne<PostWithProfile>(
      `SELECT
        p.id, p.profile_id, p.caption, p.location,
        p.likes_count, p.comments_count, p.is_pinned, p.comments_disabled,
        p.created_at, p.updated_at,
        pr.username, pr.full_name, pr.profile_image_url, pr.is_verified
       FROM posts p
       INNER JOIN profiles pr ON p.profile_id = pr.id
       WHERE p.id = ? AND p.deleted_at IS NULL AND pr.deleted_at IS NULL`,
      [id]
    );
    
    if (post) {
      post.is_pinned = Boolean(post.is_pinned);
      post.comments_disabled = Boolean(post.comments_disabled);
      post.is_verified = Boolean(post.is_verified);
    }
    
    return post || null;
  },

  /**
   * Crea un nuovo post.
   * Dopo la creazione, ricordarsi di:
   * 1. Aggiungere i media con addMedia()
   * 2. Incrementare posts_count del profilo
   * 
   * @param data - Dati del nuovo post
   * @returns ID del post creato
   */
  async create(data: CreatePostData): Promise<number> {
    const result = await execute(
      `INSERT INTO posts (profile_id, caption, location, is_comments_disabled, is_likes_hidden, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))`,
      [
        data.profile_id,
        data.caption || null,
        data.location || null,
        data.comments_disabled ? 1 : 0,
        data.is_likes_hidden ? 1 : 0,
      ]
    );
    return result.lastID;
  },

  /**
   * Aggiorna un post esistente.
   * Pattern Query Builder dinamica.
   * 
   * @param id - ID del post
   * @param data - Campi da aggiornare
   * @returns true se l'update ha avuto effetto
   */
  async update(id: number, data: UpdatePostData): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.caption !== undefined) {
      fields.push('caption = ?');
      values.push(data.caption);
    }
    if (data.location !== undefined) {
      fields.push('location = ?');
      values.push(data.location);
    }
    if (data.comments_disabled !== undefined) {
      fields.push('comments_disabled = ?');
      values.push(data.comments_disabled ? 1 : 0);
    }
    if (data.is_pinned !== undefined) {
      fields.push('is_pinned = ?');
      values.push(data.is_pinned ? 1 : 0);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    const result = await execute(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.changes > 0;
  },

  /**
   * Elimina un post (soft delete).
   * Ricordarsi di decrementare posts_count del profilo.
   * 
   * @param id - ID del post
   * @returns true se eliminato
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await execute(
      `UPDATE posts SET deleted_at = datetime('now')
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.changes > 0;
  },

  /**
   * Ottiene i post di un profilo specifico.
   * Usato nella pagina profilo.
   * 
   * @param profileId - ID del profilo
   * @param limit - Numero massimo risultati
   * @param offset - Offset per paginazione
   * @returns Array di post
   */
  async getByProfileId(profileId: number, limit = 20, offset = 0): Promise<Post[]> {
    const posts = await queryAll<Post>(
      `SELECT
        id, profile_id, caption, location,
        likes_count, comments_count, is_pinned, comments_disabled,
        created_at, updated_at
       FROM posts
       WHERE profile_id = ? AND deleted_at IS NULL
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
    
    return posts.map(p => ({
      ...p,
      is_pinned: Boolean(p.is_pinned),
      comments_disabled: Boolean(p.comments_disabled),
    }));
  },

  // ==========================================================================
  // OPERAZIONI MEDIA
  // ==========================================================================

  /**
   * Aggiunge un media a un post.
   * Un post può avere più media (carousel).
   * 
   * @param data - Dati del media
   * @returns ID del media creato
   */
  async addMedia(data: AddMediaData): Promise<number> {
    const result = await execute(
      `INSERT INTO post_media (post_id, media_url, media_type, duration_seconds, position, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [data.post_id, data.media_url, data.media_type, data.duration_seconds || null, data.position]
    );
    return result.lastID;
  },

  /**
   * Ottiene tutti i media di un post.
   * Ordinati per position (importante per carousel).
   * 
   * @param postId - ID del post
   * @returns Array di media ordinati
   */
  async getMedia(postId: number): Promise<PostMedia[]> {
    return await queryAll<PostMedia>(
      `SELECT id, post_id, media_url, media_type, duration_seconds, position
       FROM post_media
       WHERE post_id = ? AND deleted_at IS NULL
       ORDER BY position ASC`,
      [postId]
    );
  },

  /**
   * Ottiene i media di più post in una sola query.
   * Ottimizzazione per evitare N+1 query nel feed.
   * 
   * @param postIds - Array di ID post
   * @returns Map di postId -> media[]
   */
  async getMediaForPosts(postIds: number[]): Promise<Map<number, PostMedia[]>> {
    if (postIds.length === 0) return new Map();
    
    const placeholders = postIds.map(() => '?').join(',');
    const media = await queryAll<PostMedia>(
      `SELECT id, post_id, media_url, media_type, duration_seconds, position
       FROM post_media
       WHERE post_id IN (${placeholders}) AND deleted_at IS NULL
       ORDER BY post_id, position ASC`,
      postIds
    );
    
    // Raggruppa per post_id
    const mediaMap = new Map<number, PostMedia[]>();
    for (const m of media) {
      const existing = mediaMap.get(m.post_id) || [];
      existing.push(m);
      mediaMap.set(m.post_id, existing);
    }
    
    return mediaMap;
  },

  // ==========================================================================
  // OPERAZIONI LIKE
  // ==========================================================================

  /**
   * Mette like a un post.
   * Incrementa automaticamente likes_count.
   * Usa soft delete per mantenere lo storico.
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo che mette like
   * @returns true se il like è stato aggiunto (false se già esisteva attivo)
   */
  async like(postId: number, profileId: number): Promise<boolean> {
    // Verifica se esiste già un like (attivo o cancellato)
    const existing = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM likes 
       WHERE profile_id = ? AND likeable_type = 'post' AND likeable_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [profileId, postId]
    );
    
    if (existing && !existing.deleted_at) {
      // Like già attivo
      return false;
    }
    
    if (existing && existing.deleted_at) {
      // Riattiva like esistente (re-like)
      await execute(
        `UPDATE likes SET deleted_at = NULL WHERE id = ?`,
        [existing.id]
      );
    } else {
      // Crea nuovo like
      try {
        await execute(
          `INSERT INTO likes (profile_id, likeable_type, likeable_id) VALUES (?, 'post', ?)`,
          [profileId, postId]
        );
      } catch (error: unknown) {
        // Race condition: il like è stato creato da un'altra richiesta
        if (error && typeof error === 'object' && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
          console.log('[Likes] Like già esistente (race condition), skip increment');
          return false;
        }
        throw error;
      }
    }
    
    // Incrementa contatore
    await execute(
      `UPDATE posts SET likes_count = likes_count + 1
       WHERE id = ?`,
      [postId]
    );
    
    return true;
  },

  /**
   * Rimuove like da un post (soft delete).
   * Decrementa automaticamente likes_count.
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se il like è stato rimosso
   */
  async unlike(postId: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE likes SET deleted_at = datetime('now')
       WHERE profile_id = ? AND likeable_type = 'post' AND likeable_id = ? AND deleted_at IS NULL`,
      [profileId, postId]
    );
    
    if (result.changes > 0) {
      await execute(
        `UPDATE posts SET likes_count = MAX(0, likes_count - 1)
         WHERE id = ?`,
        [postId]
      );
      return true;
    }
    
    return false;
  },

  /**
   * Verifica se un profilo ha messo like a un post.
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se ha messo like attivo
   */
  async hasLiked(postId: number, profileId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT 1 FROM likes 
       WHERE profile_id = ? AND likeable_type = 'post' AND likeable_id = ? AND deleted_at IS NULL`,
      [profileId, postId]
    );
    return !!result;
  },

  /**
   * Verifica i like per più post in una query.
   * Ottimizzazione per il feed.
   * 
   * @param postIds - Array di ID post
   * @param profileId - ID del profilo
   * @returns Set di post_id con like attivi
   */
  async getLikedPostIds(postIds: number[], profileId: number): Promise<Set<number>> {
    if (postIds.length === 0) return new Set();
    
    const placeholders = postIds.map(() => '?').join(',');
    const likes = await queryAll<{ likeable_id: number }>(
      `SELECT likeable_id FROM likes 
       WHERE likeable_type = 'post' AND likeable_id IN (${placeholders}) 
         AND profile_id = ? AND deleted_at IS NULL`,
      [...postIds, profileId]
    );
    
    return new Set(likes.map(l => l.likeable_id));
  },

  // ==========================================================================
  // ==========================================================================
  // OPERAZIONI SALVATAGGIO
  // ==========================================================================

  /**
   * Salva un post nei preferiti.
   * Usa soft delete per mantenere lo storico.
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se salvato (false se già salvato attivamente)
   */
  async save(postId: number, profileId: number): Promise<boolean> {
    // Verifica se esiste già un salvataggio (attivo o cancellato)
    const existing = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM saved_posts 
       WHERE post_id = ? AND profile_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [postId, profileId]
    );
    
    if (existing && !existing.deleted_at) {
      // Già salvato attivamente
      return false;
    }
    
    if (existing && existing.deleted_at) {
      // Ri-attiva salvataggio esistente
      await execute(
        `UPDATE saved_posts SET deleted_at = NULL WHERE id = ?`,
        [existing.id]
      );
    } else {
      // Crea nuovo salvataggio
      await execute(
        `INSERT INTO saved_posts (post_id, profile_id) VALUES (?, ?)`,
        [postId, profileId]
      );
    }
    
    return true;
  },

  /**
   * Rimuove un post dai salvati (soft delete).
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se rimosso
   */
  async unsave(postId: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE saved_posts SET deleted_at = datetime('now')
       WHERE post_id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [postId, profileId]
    );
    return result.changes > 0;
  },

  /**
   * Verifica se un post è stato salvato (attivamente).
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se salvato attivo
   */
  async isSaved(postId: number, profileId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT 1 FROM saved_posts 
       WHERE post_id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [postId, profileId]
    );
    return !!result;
  },

  /**
   * Ottiene i post salvati attivamente da un profilo.
   * 
   * @param profileId - ID del profilo
   * @param limit - Numero massimo risultati
   * @param offset - Offset per paginazione
   * @returns Array di post salvati
   */
  async getSavedPosts(profileId: number, limit = 20, offset = 0): Promise<PostWithProfile[]> {
    const posts = await queryAll<PostWithProfile>(
      `SELECT
        p.id, p.profile_id, p.caption, p.location,
        p.likes_count, p.comments_count, p.is_pinned, p.comments_disabled,
        p.created_at, p.updated_at,
        pr.username, pr.full_name, pr.profile_image_url, pr.is_verified
       FROM posts p
       INNER JOIN saved_posts sp ON p.id = sp.post_id
       INNER JOIN profiles pr ON p.profile_id = pr.id
       WHERE sp.profile_id = ? 
         AND sp.deleted_at IS NULL 
         AND p.deleted_at IS NULL 
         AND pr.deleted_at IS NULL
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
    
    return posts.map(p => ({
      ...p,
      is_pinned: Boolean(p.is_pinned),
      comments_disabled: Boolean(p.comments_disabled),
      is_verified: Boolean(p.is_verified),
    }));
  },

  // ==========================================================================
  // OPERAZIONI FEED
  // ==========================================================================

  /**
   * Ottiene il feed per un utente.
   * Include post degli utenti seguiti, ordinati per data.
   * 
   * NOTA: Query complessa con subquery per i following.
   * In un'app reale si userebbe un sistema di caching (Redis).
   * 
   * @param profileId - ID del profilo che visualizza il feed
   * @param limit - Numero massimo risultati
   * @param offset - Offset per paginazione
   * @returns Array di post per il feed
   */
  async getFeed(profileId: number, limit = 20, offset = 0): Promise<PostWithProfile[]> {
    const posts = await queryAll<PostWithProfile>(
      `SELECT DISTINCT
        p.id, p.profile_id, p.caption, p.location,
        p.likes_count, p.comments_count, p.is_pinned, p.comments_disabled,
        p.created_at, p.updated_at,
        pr.username, pr.full_name, pr.profile_image_url, pr.is_verified
       FROM posts p
       INNER JOIN profiles pr ON p.profile_id = pr.id
       WHERE p.deleted_at IS NULL 
         AND pr.deleted_at IS NULL
         AND (
           p.profile_id = ?
           OR p.profile_id IN (
             SELECT following_profile_id 
             FROM follows 
             WHERE follower_profile_id = ? 
               AND status = 'accepted' 
               AND deleted_at IS NULL
           )
         )
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, profileId, limit, offset]
    );
    
    return posts.map(p => ({
      ...p,
      is_pinned: Boolean(p.is_pinned),
      comments_disabled: Boolean(p.comments_disabled),
      is_verified: Boolean(p.is_verified),
    }));
  },

  /**
   * Trova un post con tutti i dettagli necessari per la visualizzazione.
   * Include status like/save per un viewer specifico.
   * 
   * Usato nelle API single post view (/api/posts/[postId]).
   * 
   * @param postId - ID del post
   * @param viewerProfileId - ID del profilo che visualizza (per is_liked, is_saved)
   * @returns Post con tutti i dettagli o null
   */
  async findByIdForView(postId: number, viewerProfileId: number | null): Promise<{
    id: number;
    profile_id: number;
    caption: string | null;
    location: string | null;
    is_comments_disabled: boolean;
    is_likes_hidden: boolean;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profile_username: string;
    profile_full_name: string | null;
    profile_image_url: string | null;
    profile_is_verified: boolean;
    profile_is_private: boolean;
    is_liked: boolean;
    is_saved: boolean;
  } | null> {
    const viewerId = viewerProfileId || 0;
    
    const post = await queryOne<any>(
      `SELECT 
        p.id,
        p.profile_id,
        p.caption,
        p.location,
        p.is_comments_disabled,
        p.is_likes_hidden,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        -- Subquery: viewer ha messo like?
        (SELECT 1 FROM likes 
         WHERE likeable_type = 'post' 
         AND likeable_id = p.id 
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        -- Subquery: viewer ha salvato?
        (SELECT 1 FROM saved_posts 
         WHERE post_id = p.id 
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON pr.id = p.profile_id
      WHERE p.id = ? AND p.deleted_at IS NULL`,
      [viewerId, viewerId, postId]
    );

    if (!post) return null;

    return {
      id: post.id,
      profile_id: post.profile_id,
      caption: post.caption,
      location: post.location,
      is_comments_disabled: Boolean(post.is_comments_disabled),
      is_likes_hidden: Boolean(post.is_likes_hidden),
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      profile_username: post.profile_username,
      profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url,
      profile_is_verified: Boolean(post.profile_is_verified),
      profile_is_private: Boolean(post.profile_is_private),
      is_liked: Boolean(post.is_liked),
      is_saved: Boolean(post.is_saved),
    };
  },

  /**
   * Verifica se l'utente può modificare/eliminare un post.
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo che richiede l'azione
   * @returns true se il profilo è proprietario del post
   */
  async isOwner(postId: number, profileId: number): Promise<boolean> {
    const post = await queryOne<{ profile_id: number }>(
      `SELECT profile_id FROM posts WHERE id = ? AND deleted_at IS NULL`,
      [postId]
    );
    return post != null && post.profile_id === profileId;
  },

  /**
   * Soft delete dei media associati a un post.
   * Da chiamare insieme a softDelete() del post.
   * 
   * @param postId - ID del post
   */
  async softDeleteMedia(postId: number): Promise<void> {
    await execute(
      `UPDATE post_media SET deleted_at = datetime('now') WHERE post_id = ?`,
      [postId]
    );
  },

  // ==========================================================================
  // OPERAZIONI TAG
  // ==========================================================================

  /**
   * Tipo per i tag dei post.
   */

  /**
   * Ottiene tutti i tag di un post con le informazioni dell'utente taggato.
   * 
   * @param postId - ID del post
   * @returns Array di tag con username
   */
  async getPostTags(postId: number): Promise<{
    id: number;
    post_id: number;
    post_media_id: number | null;
    tagged_profile_id: number;
    tagged_username: string;
    x_position: number;
    y_position: number;
    created_at: string;
  }[]> {
    return await queryAll(
      `SELECT 
        pt.id,
        pt.post_id,
        pt.post_media_id,
        pt.tagged_profile_id,
        p.username as tagged_username,
        pt.x_position,
        pt.y_position,
        pt.created_at
      FROM post_tags pt
      JOIN profiles p ON pt.tagged_profile_id = p.id
      WHERE pt.post_id = ?
      ORDER BY pt.created_at ASC`,
      [postId]
    );
  },

  // ==========================================================================
  // ==========================================================================
  // OPERAZIONI EXPLORE E REELS
  // ==========================================================================

  /**
   * Ottiene i post per la pagina Explore.
   * Include solo profili pubblici, esclusi i propri post.
   * 
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post con info profilo e stato like/save/follow
   */
  async getExplore(currentProfileId: number, limit = 30, offset = 0): Promise<{
    id: number;
    profile_id: number;
    caption: string | null;
    location: string | null;
    is_comments_disabled: boolean;
    is_likes_hidden: boolean;
    likes_count: number;
    comments_count: number;
    created_at: string;
    profile_username: string;
    profile_full_name: string | null;
    profile_image_url: string | null;
    profile_is_verified: boolean;
    profile_is_private: boolean;
    profile_has_active_story: boolean;
    is_following_author: boolean;
    is_liked: boolean;
    is_saved: boolean;
  }[]> {
    const posts = await queryAll<any>(
      `SELECT DISTINCT
        p.id,
        p.profile_id,
        p.caption,
        p.location,
        p.is_comments_disabled,
        p.is_likes_hidden,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        (SELECT 1 FROM stories
         WHERE profile_id = pr.id
         AND deleted_at IS NULL
         AND datetime(expires_at) > datetime('now')) as profile_has_active_story,
        (SELECT 1 FROM follows
         WHERE follower_profile_id = ?
         AND following_profile_id = pr.id
         AND status = 'accepted'
         AND deleted_at IS NULL) as is_following_author,
        (SELECT 1 FROM likes
         WHERE likeable_type = 'post'
         AND likeable_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts
         WHERE post_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND pr.is_private = 0
        AND p.profile_id != ?
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, limit, offset]
    );

    return posts.map((p: any) => ({
      id: p.id,
      profile_id: p.profile_id,
      caption: p.caption,
      location: p.location,
      is_comments_disabled: Boolean(p.is_comments_disabled),
      is_likes_hidden: Boolean(p.is_likes_hidden),
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      created_at: p.created_at,
      profile_username: p.profile_username,
      profile_full_name: p.profile_full_name,
      profile_image_url: p.profile_image_url,
      profile_is_verified: Boolean(p.profile_is_verified),
      profile_is_private: Boolean(p.profile_is_private),
      profile_has_active_story: Boolean(p.profile_has_active_story),
      is_following_author: Boolean(p.is_following_author),
      is_liked: Boolean(p.is_liked),
      is_saved: Boolean(p.is_saved),
    }));
  },

  /**
   * Ottiene i reels (video) per il feed reels.
   * 
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post video con info profilo
   */
  async getReels(currentProfileId: number, limit = 10, offset = 0): Promise<ReelWithDetails[]> {
    const posts = await queryAll<any>(
      `SELECT DISTINCT
        p.id,
        p.profile_id,
        p.caption,
        p.location,
        p.is_comments_disabled,
        p.is_likes_hidden,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        (SELECT 1 FROM likes
         WHERE likeable_type = 'post'
         AND likeable_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts
         WHERE post_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      INNER JOIN post_media pm ON pm.post_id = p.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND pm.media_type = 'video'
        AND (
          pr.is_private = 0
          OR pr.id = ?
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follower_profile_id = ?
              AND following_profile_id = pr.id
              AND status = 'accepted'
              AND deleted_at IS NULL
          )
        )
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, limit, offset]
    );

    return posts.map((p: any) => ({
      id: p.id,
      profile_id: p.profile_id,
      caption: p.caption,
      location: p.location,
      is_comments_disabled: Boolean(p.is_comments_disabled),
      is_likes_hidden: Boolean(p.is_likes_hidden),
      likes_count: p.likes_count,
      comments_count: p.comments_count,
      created_at: p.created_at,
      profile_username: p.profile_username,
      profile_full_name: p.profile_full_name,
      profile_image_url: p.profile_image_url,
      profile_is_verified: Boolean(p.profile_is_verified),
      is_liked: Boolean(p.is_liked),
      is_saved: Boolean(p.is_saved),
    }));
  },

  /**
   * Conta i reels totali visibili per un profilo.
   * 
   * @param currentProfileId - ID del profilo corrente
   * @returns Numero totale di reels
   */
  async countReels(currentProfileId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM posts p
       INNER JOIN profiles pr ON p.profile_id = pr.id
       INNER JOIN post_media pm ON pm.post_id = p.id
       WHERE p.deleted_at IS NULL
         AND pr.deleted_at IS NULL
         AND pm.media_type = 'video'
         AND (
           pr.is_private = 0
           OR pr.id = ?
           OR EXISTS (
             SELECT 1 FROM follows
             WHERE follower_profile_id = ?
               AND following_profile_id = pr.id
               AND status = 'accepted'
               AND deleted_at IS NULL
           )
         )`,
      [currentProfileId, currentProfileId]
    );
    return result?.count || 0;
  },

  // ==========================================================================
  // OPERAZIONI POST PROFILO (GRID)
  // ==========================================================================

  /**
   * Tipo per i post nella griglia del profilo.
   */

  /**
   * Ottiene i post normali di un profilo per la griglia.
   * 
   * @param profileId - ID del profilo
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post con thumbnail
   */
  async getProfilePosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number;
    caption: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    media_count: number;
  }[]> {
    return await queryAll(
      `SELECT
        p.id,
        p.caption,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pm.media_url,
        pm.media_type,
        (SELECT COUNT(*)
         FROM post_media pm2
         WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
      FROM posts p
      LEFT JOIN post_media pm
        ON pm.post_id = p.id
        AND pm.position = 0
        AND pm.deleted_at IS NULL
      WHERE p.profile_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i reels di un profilo (post con video).
   * 
   * @param profileId - ID del profilo
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post video
   */
  async getProfileReels(profileId: number, limit = 12, offset = 0): Promise<{
    id: number;
    caption: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    media_count: number;
  }[]> {
    return await queryAll(
      `SELECT
        p.id,
        p.caption,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pm.media_url,
        pm.media_type,
        (SELECT COUNT(*)
         FROM post_media pm2
         WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
      FROM posts p
      LEFT JOIN post_media pm
        ON pm.post_id = p.id
        AND pm.position = 0
        AND pm.deleted_at IS NULL
      WHERE p.profile_id = ?
        AND p.deleted_at IS NULL
        AND pm.media_type = 'video'
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i post salvati da un profilo.
   * 
   * @param profileId - ID del profilo
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post salvati
   */
  async getProfileSavedPosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number;
    caption: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    media_count: number;
  }[]> {
    return await queryAll(
      `SELECT DISTINCT
        p.id,
        p.caption,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pm.media_url,
        pm.media_type,
        (SELECT COUNT(*)
         FROM post_media pm2
         WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
      FROM saved_posts sp
      INNER JOIN posts p ON p.id = sp.post_id
      LEFT JOIN post_media pm
        ON pm.post_id = p.id
        AND pm.position = 0
        AND pm.deleted_at IS NULL
      WHERE sp.profile_id = ?
        AND sp.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ORDER BY sp.created_at DESC
      LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i post in cui un profilo è taggato.
   * 
   * @param profileId - ID del profilo taggato
   * @param limit - Limite risultati
   * @param offset - Offset paginazione
   * @returns Array di post dove il profilo è taggato
   */
  async getTaggedPosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number;
    caption: string | null;
    likes_count: number;
    comments_count: number;
    created_at: string;
    media_url: string | null;
    media_type: 'image' | 'video' | null;
    media_count: number;
  }[]> {
    return await queryAll(
      `SELECT DISTINCT
        p.id,
        p.caption,
        p.likes_count,
        p.comments_count,
        p.created_at,
        pm.media_url,
        pm.media_type,
        (SELECT COUNT(*)
         FROM post_media pm2
         WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
      FROM posts p
      INNER JOIN post_tags pt ON pt.post_id = p.id
      LEFT JOIN post_media pm
        ON pm.post_id = p.id
        AND pm.position = 0
        AND pm.deleted_at IS NULL
      WHERE pt.tagged_profile_id = ?
        AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i post recenti di un profilo per l'anteprima.
   * Usato nella card di anteprima profilo (hover).
   * 
   * @param profileId - ID del profilo
   * @param limit - Limite risultati (default 3)
   * @returns Array di post con media
   */
  async getRecentPostsForPreview(profileId: number, limit = 3): Promise<{
    id: number;
    media_url: string | null;
    media_type: string | null;
  }[]> {
    return await queryAll(
      `SELECT p.id, pm.media_url, pm.media_type
       FROM posts p
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0
       WHERE p.profile_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [profileId, limit]
    );
  },

  /**
   * Ottiene il feed per l'utente corrente.
   * Include post propri, di profili seguiti e di profili pubblici.
   * 
   * Include flag per ogni post:
   * - is_liked: se l'utente ha messo like
   * - is_saved: se l'utente ha salvato il post
   * - is_following: se l'utente segue l'autore
   * - profile_has_active_story: se l'autore ha storie attive
   * 
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Numero massimo di post
   * @param offset - Offset per paginazione
   * @returns Array di post con tutti i dettagli per il feed
   */
  async getFeedWithDetails(currentProfileId: number, limit: number, offset: number): Promise<FeedPostWithDetails[]> {
    return await queryAll(
      `SELECT DISTINCT
        p.id, 
        p.profile_id, 
        p.caption, 
        p.location,
        p.is_comments_disabled, 
        p.is_likes_hidden,
        p.likes_count, 
        p.comments_count, 
        p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url as profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        -- Subquery: l'autore ha storie attive?
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM stories s
          WHERE s.profile_id = p.profile_id
            AND s.deleted_at IS NULL
            AND s.expires_at > datetime('now')
            AND (
              s.profile_id = ?
              OR s.profile_id IN (
                SELECT following_profile_id FROM follows
                WHERE follower_profile_id = ?
                  AND status = 'accepted'
                  AND deleted_at IS NULL
              )
              OR NOT EXISTS (
                SELECT 1 FROM story_views sv
                WHERE sv.story_id = s.id
                  AND sv.viewer_profile_id = ?
              )
            )
         ) THEN 1 ELSE 0 END
        ) as profile_has_active_story,
        -- Subquery: l'utente corrente ha visualizzato TUTTE le storie attive?
        (SELECT CASE
           WHEN (SELECT COUNT(*) FROM stories s1 
                 WHERE s1.profile_id = p.profile_id 
                   AND s1.deleted_at IS NULL 
                   AND datetime(s1.expires_at) > datetime('now')) = 0 
           THEN 0
           WHEN (SELECT COUNT(*) FROM stories s2 
                 WHERE s2.profile_id = p.profile_id 
                   AND s2.deleted_at IS NULL 
                   AND datetime(s2.expires_at) > datetime('now')
                   AND EXISTS (
                     SELECT 1 FROM story_views sv 
                     WHERE sv.story_id = s2.id 
                       AND sv.viewer_profile_id = ?
                   )) = (SELECT COUNT(*) FROM stories s3 
                         WHERE s3.profile_id = p.profile_id 
                           AND s3.deleted_at IS NULL 
                           AND datetime(s3.expires_at) > datetime('now'))
           THEN 1 ELSE 0 END
        ) as profile_has_viewed_story,
        -- Subquery: l'utente corrente ha messo like?
        (SELECT 1 FROM likes
         WHERE likeable_type = 'post'
         AND likeable_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked,
        -- Subquery: l'utente corrente ha salvato?
        (SELECT 1 FROM saved_posts
         WHERE post_id = p.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_saved,
        -- Subquery: l'utente corrente segue l'autore?
        (SELECT 1 FROM follows
         WHERE follower_profile_id = ?
         AND following_profile_id = p.profile_id
         AND status = 'accepted'
         AND deleted_at IS NULL) as is_following
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND (
          -- Solo l'ultimo post dell'utente corrente (per non saturare il feed)
          (p.profile_id = ? AND p.id = (
            SELECT id FROM posts 
            WHERE profile_id = ? 
            AND deleted_at IS NULL 
            ORDER BY created_at DESC 
            LIMIT 1
          ))
          -- OPPURE post da utenti che l'utente corrente segue
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_profile_id = ?
              AND f.following_profile_id = p.profile_id
              AND f.status = 'accepted'
              AND f.deleted_at IS NULL
          )
          -- OPPURE post da profili pubblici (Esplora), escludendo i propri
          OR (pr.is_private = 0 AND p.profile_id != ?)
        )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [
        currentProfileId, // per controllo storie proprie
        currentProfileId, // per follows nel controllo storie
        currentProfileId, // per story_views check
        currentProfileId, // per has_viewed_story check
        currentProfileId, // per is_liked
        currentProfileId, // per is_saved
        currentProfileId, // per is_following
        currentProfileId, // per controllo post proprio
        currentProfileId, // per subquery post proprio
        currentProfileId, // per controllo follows
        currentProfileId, // per escludere post propri da profili pubblici
        limit,
        offset
      ]
    );
  },

  /**
   * Converte FeedPostWithDetails (dal DB con INTEGER) in formato API (con boolean).
   * Utility helper per evitare conversioni manuali ripetute.
   * 
   * @param post - Post dal database
   * @param media - Array di media del post
   * @returns Post formattato per l'API
   */
  convertFeedPostForAPI(
    post: FeedPostWithDetails,
    media: PostMedia[]
  ): FeedPostForAPI {
    return {
      id: post.id,
      profile_id: post.profile_id,
      caption: post.caption,
      location: post.location,
      is_comments_disabled: Boolean(post.is_comments_disabled),
      is_likes_hidden: Boolean(post.is_likes_hidden),
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      profile_username: post.profile_username,
      profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url,
      profile_is_verified: Boolean(post.profile_is_verified),
      profile_has_active_story: Boolean(post.profile_has_active_story),
      profile_has_viewed_story: Boolean(post.profile_has_viewed_story),
      profile_is_private: Boolean(post.profile_is_private),
      media,
      is_liked_by_current_user: Boolean(post.is_liked),
      is_saved_by_current_user: Boolean(post.is_saved),
      is_following_author: Boolean(post.is_following),
    };
  },

  /**
   * Converte ReelWithDetails (dal DB) in formato API Reel.
   * Utility helper per evitare conversioni manuali ripetute.
   * 
   * @param reel - Reel dal database
   * @param media - Array di media del reel
   * @returns Reel formattato per l'API
   */
  convertReelForAPI(
    reel: ReelWithDetails,
    media: PostMedia[]
  ): import('@/types/feed').Reel {
    return {
      id: reel.id,
      profile_id: reel.profile_id,
      caption: reel.caption,
      location: reel.location,
      is_comments_disabled: reel.is_comments_disabled,
      is_likes_hidden: reel.is_likes_hidden,
      likes_count: reel.likes_count,
      comments_count: reel.comments_count,
      created_at: reel.created_at,
      profile_username: reel.profile_username,
      profile_full_name: reel.profile_full_name,
      profile_image_url: reel.profile_image_url,
      profile_is_verified: reel.profile_is_verified,
      is_liked_by_current_user: reel.is_liked,
      is_saved_by_current_user: reel.is_saved,
      media,
    };
  },

  /**
   * Converte PostForView (dal DB) in formato API FeedPost.
   * Usato per vista singolo post.
   * 
   * @param post - Post dal database
   * @param media - Array di media del post
   * @returns FeedPost formattato per l'API
   */
  convertPostForViewToAPI(
    post: PostForView,
    media: PostMedia[]
  ): import('@/types/feed').FeedPost {
    return {
      id: post.id,
      profile_id: post.profile_id,
      caption: post.caption,
      location: post.location,
      is_comments_disabled: post.is_comments_disabled,
      is_likes_hidden: post.is_likes_hidden,
      likes_count: post.likes_count,
      comments_count: post.comments_count,
      created_at: post.created_at,
      profile_username: post.profile_username,
      profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url,
      profile_is_verified: post.profile_is_verified,
      profile_is_private: post.profile_is_private,
      // Campi non disponibili in vista singolo post
      profile_has_active_story: false,
      profile_has_viewed_story: false,
      is_following_author: false,
      // Status interazione utente
      is_liked_by_current_user: post.is_liked,
      is_saved_by_current_user: post.is_saved,
      media,
    };
  },
};

export default postRepository;
