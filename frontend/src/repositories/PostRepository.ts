/**
 * @fileoverview Post Repository (Repository Pattern)
 *
 * Gestisce tutte le operazioni database relative ai post.
 * Include media allegati, like, salvataggi, feed, explore e reels.
 *
 * TABELLE PRINCIPALI:
 * - posts: dati del post (caption, contatori, flag)
 * - post_media: media allegati (immagini/video) con posizione
 * - likes: like polimorfici (likeable_type='post', soft delete con deleted_at)
 * - saved_posts: post salvati (soft delete con deleted_at)
 * - post_tags: tag di profili nelle foto
 *
 * @module repositories/PostRepository
 *
 * @example
 * import { postRepository } from '@/repositories';
 *
 * // Crea un post con media
 * const postId = await postRepository.create({ profile_id: 1, caption: 'Ciao!' });
 * await postRepository.addMedia({ post_id: postId, media_url: '...', media_type: 'image', position: 0 });
 *
 */

import { queryOne, queryAll, execute } from '@/lib/db';

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

export interface PostWithProfile extends Post {
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
}

export interface PostMedia {
  id: number;
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
}

export interface CreatePostData {
  profile_id: number;
  caption?: string;
  location?: string;
  comments_disabled?: boolean;
  is_likes_hidden?: boolean;
}

export interface UpdatePostData {
  caption?: string;
  location?: string;
  comments_disabled?: boolean;
  is_pinned?: boolean;
}

export interface AddMediaData {
  post_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds?: number;
  position: number;
}

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

export const postRepository = {

  /**
   * Trova un post per ID (esclude i soft-deleted).
   *
   * @param id - ID del post
   * @returns Post o null
   */
  async findById(id: number): Promise<Post | null> {
    const post = await queryOne<Post>(
      `SELECT id, profile_id, caption, location,
        likes_count, comments_count, created_at, updated_at
       FROM posts WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return post || null;
  },

  /**
   * Trova un post con dati del profilo autore (JOIN su profiles).
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
    return post || null;
  },

  /**
   * Crea un nuovo post.
   * Usa `RETURNING id` per ottenere l'ID generato da PostgreSQL.
   *
   * @param data - Dati del post
   * @returns ID del post creato
   */
  async create(data: CreatePostData): Promise<number> {
    const result = await execute(
      `INSERT INTO posts (profile_id, caption, location, is_comments_disabled, is_likes_hidden)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [
        data.profile_id,
        data.caption || null,
        data.location || null,
        data.comments_disabled ?? false,
        data.is_likes_hidden ?? false,
      ]
    );
    return result.lastID;
  },

  /**
   * Aggiorna un post esistente (Partial Update dinamico).
   * Solo i campi forniti vengono modificati.
   *
   * @param id - ID del post
   * @param data - Campi da aggiornare
   * @returns true se almeno una riga è stata modificata
   */
  async update(id: number, data: UpdatePostData): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.caption !== undefined) { fields.push('caption = ?'); values.push(data.caption); }
    if (data.location !== undefined) { fields.push('location = ?'); values.push(data.location); }
    if (data.comments_disabled !== undefined) { fields.push('comments_disabled = ?'); values.push(data.comments_disabled); }
    if (data.is_pinned !== undefined) { fields.push('is_pinned = ?'); values.push(data.is_pinned); }

    if (fields.length === 0) return false;
    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await execute(
      `UPDATE posts SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.changes > 0;
  },

  /**
   * Soft delete di un post (imposta deleted_at = NOW()).
   *
   * @param id - ID del post
   * @returns true se eliminato
   */
  async softDelete(id: number): Promise<boolean> {
    const result = await execute(
      `UPDATE posts SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    return result.changes > 0;
  },

  /**
   * Ottiene i post di un profilo, ordinati per pin e data.
   *
   * @param profileId - ID del profilo
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post
   */
  async getByProfileId(profileId: number, limit = 20, offset = 0): Promise<Post[]> {
    return queryAll<Post>(
      `SELECT id, profile_id, caption, location,
        likes_count, comments_count, is_pinned, comments_disabled,
        created_at, updated_at
       FROM posts
       WHERE profile_id = ? AND deleted_at IS NULL
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Aggiunge un media a un post.
   * `position` determina l'ordine nella galleria (0 = prima immagine).
   *
   * @param data - Dati del media
   * @returns ID del media creato
   */
  async addMedia(data: AddMediaData): Promise<number> {
    const result = await execute(
      `INSERT INTO post_media (post_id, media_url, media_type, duration_seconds, position)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [data.post_id, data.media_url, data.media_type, data.duration_seconds || null, data.position]
    );
    return result.lastID;
  },

  /**
   * Ottiene i media di un post, ordinati per posizione.
   *
   * @param postId - ID del post
   * @returns Array di media ordinati per position ASC
   */
  async getMedia(postId: number): Promise<PostMedia[]> {
    return queryAll<PostMedia>(
      `SELECT id, post_id, media_url, media_type, duration_seconds, position
       FROM post_media
       WHERE post_id = ? AND deleted_at IS NULL
       ORDER BY position ASC`,
      [postId]
    );
  },

  /**
   * Ottiene i media per più post in una sola query (batch load).
   * Evita il problema N+1: invece di N query separate, ne fa una sola.
   *
   * @param postIds - Array di ID dei post
   * @returns Map<postId, PostMedia[]>
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
    const mediaMap = new Map<number, PostMedia[]>();
    for (const m of media) {
      const existing = mediaMap.get(m.post_id) || [];
      existing.push(m);
      mediaMap.set(m.post_id, existing);
    }
    return mediaMap;
  },

  /**
   * Salva un post nella collezione dell'utente.
   * Se era già salvato (soft-deleted), lo riattiva invece di creare un duplicato.
   *
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se il salvataggio è nuovo, false se era già salvato
   */
  async save(postId: number, profileId: number): Promise<boolean> {
    const existing = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM saved_posts
       WHERE post_id = ? AND profile_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [postId, profileId]
    );
    if (existing && !existing.deleted_at) return false;
    if (existing && existing.deleted_at) {
      await execute(`UPDATE saved_posts SET deleted_at = NULL WHERE id = ?`, [existing.id]);
    } else {
      await execute(`INSERT INTO saved_posts (post_id, profile_id) VALUES (?, ?)`, [postId, profileId]);
    }
    return true;
  },

  /**
   * Rimuove un post dalla collezione salvati (soft delete).
   *
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se rimosso
   */
  async unsave(postId: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE saved_posts SET deleted_at = NOW()
       WHERE post_id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [postId, profileId]
    );
    return result.changes > 0;
  },

  /**
   * Verifica se un post è nei salvati dell'utente.
   *
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se salvato
   */
  async isSaved(postId: number, profileId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT 1 FROM saved_posts WHERE post_id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [postId, profileId]
    );
    return !!result;
  },

  /**
   * Ottiene i post salvati dall'utente con dati del profilo autore.
   *
   * @param profileId - ID del profilo
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post con profilo, ordinati per data salvataggio
   */
  async getSavedPosts(profileId: number, limit = 20, offset = 0): Promise<PostWithProfile[]> {
    return queryAll<PostWithProfile>(
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
  },

  /**
   * Ottiene il feed dell'utente: i propri post + quelli degli utenti seguiti.
   * Usa `DISTINCT` per evitare duplicati in caso di self-join.
   *
   * @param profileId - ID del profilo corrente
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post con profilo, ordinati per data decrescente
   */
  async getFeed(profileId: number, limit = 20, offset = 0): Promise<PostWithProfile[]> {
    return queryAll<PostWithProfile>(
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
             SELECT following_profile_id FROM follows
             WHERE follower_profile_id = ? AND status = 'accepted' AND deleted_at IS NULL
           )
         )
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, profileId, limit, offset]
    );
  },

  /**
   * Trova un post con tutti i dati necessari per la pagina di dettaglio.
   * Include is_liked e is_saved del viewer corrente.
   *
   * @param postId - ID del post
   * @param viewerProfileId - ID del profilo che visualizza (null se non autenticato)
   * @returns Post con flag viewer o null
   */
  async findByIdForView(postId: number, viewerProfileId: number | null): Promise<PostForView | null> {
    const viewerId = viewerProfileId || 0;
    const post = await queryOne<any>(
      `SELECT
        p.id, p.profile_id, p.caption, p.location,
        p.is_comments_disabled, p.is_likes_hidden,
        p.likes_count, p.comments_count, p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        (SELECT 1 FROM likes WHERE likeable_type = 'post' AND likeable_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts WHERE post_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_saved
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
   * Verifica se un profilo è l'autore di un post.
   * Usato per autorizzare modifica/eliminazione.
   *
   * @param postId - ID del post
   * @param profileId - ID del profilo
   * @returns true se il profilo è l'autore
   */
  async isOwner(postId: number, profileId: number): Promise<boolean> {
    const post = await queryOne<{ profile_id: number }>(
      `SELECT profile_id FROM posts WHERE id = ? AND deleted_at IS NULL`,
      [postId]
    );
    return post != null && post.profile_id === profileId;
  },

  /**
   * Soft delete di tutti i media di un post.
   * Chiamare prima del soft delete del post per mantenere coerenza.
   *
   * @param postId - ID del post
   */
  async softDeleteMedia(postId: number): Promise<void> {
    await execute(
      `UPDATE post_media SET deleted_at = NOW() WHERE post_id = ?`,
      [postId]
    );
  },

  /**
   * Ottiene i tag di persone in un post con username del profilo taggato.
   *
   * @param postId - ID del post
   * @returns Array di tag con posizione (x, y) e username
   */
  async getPostTags(postId: number): Promise<{
    id: number; post_id: number; post_media_id: number | null;
    tagged_profile_id: number; tagged_username: string;
    x_position: number; y_position: number; created_at: string;
  }[]> {
    return queryAll(
      `SELECT pt.id, pt.post_id, pt.post_media_id, pt.tagged_profile_id,
        p.username as tagged_username, pt.x_position, pt.y_position, pt.created_at
       FROM post_tags pt
       JOIN profiles p ON pt.tagged_profile_id = p.id
       WHERE pt.post_id = ?
       ORDER BY pt.created_at ASC`,
      [postId]
    );
  },

  /**
   * Ottiene post per la pagina Esplora.
   * Restituisce post pubblici di profili non seguiti, ordinati casualmente.
   * Include is_liked, is_saved, is_following_author del viewer.
   *
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post con flag viewer
   */
  async getExplore(currentProfileId: number, limit = 30, offset = 0): Promise<{
    id: number; profile_id: number; caption: string | null; location: string | null;
    is_comments_disabled: boolean; is_likes_hidden: boolean;
    likes_count: number; comments_count: number; created_at: string;
    profile_username: string; profile_full_name: string | null;
    profile_image_url: string | null; profile_is_verified: boolean;
    profile_is_private: boolean; profile_has_active_story: boolean;
    is_following_author: boolean; is_liked: boolean; is_saved: boolean;
  }[]> {
    const posts = await queryAll<any>(
      `SELECT
        p.id, p.profile_id, p.caption, p.location,
        p.is_comments_disabled, p.is_likes_hidden,
        p.likes_count, p.comments_count, p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        EXISTS(
          SELECT 1 FROM stories
          WHERE profile_id = pr.id AND deleted_at IS NULL AND expires_at > NOW()
        ) as profile_has_active_story,
        (SELECT 1 FROM follows
         WHERE follower_profile_id = ? AND following_profile_id = pr.id
           AND status = 'accepted' AND deleted_at IS NULL) as is_following_author,
        (SELECT 1 FROM likes WHERE likeable_type = 'post' AND likeable_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts WHERE post_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL AND pr.deleted_at IS NULL
        AND NOT pr.is_private AND p.profile_id != ?
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, limit, offset]
    );
    return posts.map((p: any) => ({
      ...p,
      is_comments_disabled: Boolean(p.is_comments_disabled),
      is_likes_hidden: Boolean(p.is_likes_hidden),
      profile_is_verified: Boolean(p.profile_is_verified),
      profile_is_private: Boolean(p.profile_is_private),
      profile_has_active_story: Boolean(p.profile_has_active_story),
      is_following_author: Boolean(p.is_following_author),
      is_liked: Boolean(p.is_liked),
      is_saved: Boolean(p.is_saved),
    }));
  },

  /**
   * Ottiene i reels (post con video) accessibili al profilo corrente.
   * Include i propri + quelli dei profili seguiti + profili pubblici.
   * Ordinati casualmente (ORDER BY RANDOM()).
   *
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di reels con flag viewer
   */
  async getReels(currentProfileId: number, limit = 10, offset = 0): Promise<ReelWithDetails[]> {
    const posts = await queryAll<any>(
      `SELECT
        p.id, p.profile_id, p.caption, p.location,
        p.is_comments_disabled, p.is_likes_hidden,
        p.likes_count, p.comments_count, p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url,
        pr.is_verified as profile_is_verified,
        (SELECT 1 FROM likes WHERE likeable_type = 'post' AND likeable_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts WHERE post_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_saved
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL
        AND pr.deleted_at IS NULL
        AND EXISTS (
          SELECT 1
          FROM post_media pm
          WHERE pm.post_id = p.id
            AND pm.media_type = 'video'
            AND pm.deleted_at IS NULL
        )
        AND (
          NOT pr.is_private OR pr.id = ?
          OR EXISTS (
            SELECT 1 FROM follows
            WHERE follower_profile_id = ? AND following_profile_id = pr.id
              AND status = 'accepted' AND deleted_at IS NULL
          )
        )
      ORDER BY RANDOM()
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, limit, offset]
    );
    return posts.map((p: any) => ({
      id: p.id, profile_id: p.profile_id, caption: p.caption, location: p.location,
      is_comments_disabled: Boolean(p.is_comments_disabled),
      is_likes_hidden: Boolean(p.is_likes_hidden),
      likes_count: p.likes_count, comments_count: p.comments_count, created_at: p.created_at,
      profile_username: p.profile_username, profile_full_name: p.profile_full_name,
      profile_image_url: p.profile_image_url,
      profile_is_verified: Boolean(p.profile_is_verified),
      is_liked: Boolean(p.is_liked),
      is_saved: Boolean(p.is_saved),
    }));
  },

  /**
   * Conta il totale dei reels accessibili (per la paginazione).
   * NOTA: PostgreSQL restituisce COUNT come bigint (stringa) — usiamo Number().
   *
   * @param currentProfileId - ID del profilo corrente
   * @returns Numero totale di reels accessibili
   */
  async countReels(currentProfileId: number): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(DISTINCT p.id) as count
       FROM posts p
       INNER JOIN profiles pr ON p.profile_id = pr.id
       INNER JOIN post_media pm ON pm.post_id = p.id
       WHERE p.deleted_at IS NULL AND pr.deleted_at IS NULL AND pm.media_type = 'video'
         AND (
           NOT pr.is_private OR pr.id = ?
           OR EXISTS (
             SELECT 1 FROM follows
             WHERE follower_profile_id = ? AND following_profile_id = pr.id
               AND status = 'accepted' AND deleted_at IS NULL
           )
         )`,
      [currentProfileId, currentProfileId]
    );
    return Number(result?.count) || 0;
  },

  /**
   * Ottiene i post di un profilo per la griglia del profilo.
   * Include solo il primo media (position=0) e il conteggio totale media.
   *
   * @param profileId - ID del profilo
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post con thumbnail e media_count
   */
  async getProfilePosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number; caption: string | null; likes_count: number; comments_count: number;
    created_at: string; media_url: string | null; media_type: 'image' | 'video' | null; media_count: number;
  }[]> {
    return queryAll(
      `SELECT p.id, p.caption, p.likes_count, p.comments_count, p.created_at,
        pm.media_url, pm.media_type,
        (SELECT COUNT(*) FROM post_media pm2 WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
       FROM posts p
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0 AND pm.deleted_at IS NULL
       WHERE p.profile_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i reels di un profilo per la tab Reels del profilo.
   *
   * @param profileId - ID del profilo
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di reels con thumbnail
   */
  async getProfileReels(profileId: number, limit = 12, offset = 0): Promise<{
    id: number; caption: string | null; likes_count: number; comments_count: number;
    created_at: string; media_url: string | null; media_type: 'image' | 'video' | null; media_count: number;
  }[]> {
    return queryAll(
      `SELECT p.id, p.caption, p.likes_count, p.comments_count, p.created_at,
        pm.media_url, pm.media_type,
        (SELECT COUNT(*) FROM post_media pm2 WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
       FROM posts p
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0 AND pm.deleted_at IS NULL
       WHERE p.profile_id = ? AND p.deleted_at IS NULL AND pm.media_type = 'video'
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i post salvati di un profilo per la tab Salvati del profilo.
   *
   * @param profileId - ID del profilo
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post salvati con thumbnail
   */
  async getProfileSavedPosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number; caption: string | null; likes_count: number; comments_count: number;
    created_at: string; media_url: string | null; media_type: 'image' | 'video' | null; media_count: number;
  }[]> {
    return queryAll(
      `SELECT p.id, p.caption, p.likes_count, p.comments_count, p.created_at,
        pm.media_url, pm.media_type,
        (SELECT COUNT(*) FROM post_media pm2 WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
       FROM saved_posts sp
       INNER JOIN posts p ON p.id = sp.post_id
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0 AND pm.deleted_at IS NULL
       WHERE sp.profile_id = ? AND sp.deleted_at IS NULL AND p.deleted_at IS NULL
       ORDER BY sp.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene i post in cui un profilo è stato taggato.
   *
   * @param profileId - ID del profilo taggato
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di post con thumbnail
   */
  async getTaggedPosts(profileId: number, limit = 12, offset = 0): Promise<{
    id: number; caption: string | null; likes_count: number; comments_count: number;
    created_at: string; media_url: string | null; media_type: 'image' | 'video' | null; media_count: number;
  }[]> {
    return queryAll(
      `SELECT DISTINCT p.id, p.caption, p.likes_count, p.comments_count, p.created_at,
        pm.media_url, pm.media_type,
        (SELECT COUNT(*) FROM post_media pm2 WHERE pm2.post_id = p.id AND pm2.deleted_at IS NULL) as media_count
       FROM posts p
       INNER JOIN post_tags pt ON pt.post_id = p.id
       LEFT JOIN post_media pm ON pm.post_id = p.id AND pm.position = 0 AND pm.deleted_at IS NULL
       WHERE pt.tagged_profile_id = ? AND p.deleted_at IS NULL
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
  },

  /**
   * Ottiene gli ultimi N post di un profilo per le anteprime (es. hover card).
   *
   * @param profileId - ID del profilo
   * @param limit - Numero di post da restituire (default: 3)
   * @returns Array di post con thumbnail
   */
  async getRecentPostsForPreview(profileId: number, limit = 3): Promise<{
    id: number; media_url: string | null; media_type: string | null;
  }[]> {
    return queryAll(
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
   * Ottiene il feed completo con tutti i dettagli necessari all'API.
   * Include: profilo autore, stato storie, is_liked, is_saved, is_following.
   *
   * LOGICA DI SELEZIONE POST:
   * 1. Il proprio ultimo post
   * 2. Post degli utenti seguiti (status='accepted')
   * 3. Post pubblici di altri utenti
   *
   * STATO STORIE:
   * - has_active_story: ci sono storie non scadute E non ancora viste dal viewer
   * - has_viewed_story: il viewer ha visto TUTTE le storie attive del profilo
   *
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di FeedPostWithDetails (row raw del database)
   */
  async getFeedWithDetails(currentProfileId: number, limit: number, offset: number): Promise<FeedPostWithDetails[]> {
    return queryAll(
      `SELECT DISTINCT
        p.id, p.profile_id, p.caption, p.location,
        p.is_comments_disabled, p.is_likes_hidden,
        p.likes_count, p.comments_count, p.created_at,
        pr.username as profile_username,
        pr.full_name as profile_full_name,
        pr.profile_image_url as profile_image_url,
        pr.is_verified as profile_is_verified,
        pr.is_private as profile_is_private,
        (SELECT CASE WHEN EXISTS (
          SELECT 1 FROM stories s
          WHERE s.profile_id = p.profile_id AND s.deleted_at IS NULL AND s.expires_at > NOW()
            AND (
              s.profile_id = ?
              OR s.profile_id IN (
                SELECT following_profile_id FROM follows
                WHERE follower_profile_id = ? AND status = 'accepted' AND deleted_at IS NULL
              )
              OR NOT EXISTS (
                SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_profile_id = ?
              )
            )
        ) THEN 1 ELSE 0 END) as profile_has_active_story,
        (SELECT CASE
           WHEN (SELECT COUNT(*) FROM stories s1 WHERE s1.profile_id = p.profile_id
                   AND s1.deleted_at IS NULL AND s1.expires_at > NOW()) = 0
           THEN 0
           WHEN (SELECT COUNT(*) FROM stories s2 WHERE s2.profile_id = p.profile_id
                   AND s2.deleted_at IS NULL AND s2.expires_at > NOW()
                   AND EXISTS (SELECT 1 FROM story_views sv WHERE sv.story_id = s2.id AND sv.viewer_profile_id = ?))
                = (SELECT COUNT(*) FROM stories s3 WHERE s3.profile_id = p.profile_id
                     AND s3.deleted_at IS NULL AND s3.expires_at > NOW())
           THEN 1 ELSE 0 END
        ) as profile_has_viewed_story,
        (SELECT 1 FROM likes WHERE likeable_type = 'post' AND likeable_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_liked,
        (SELECT 1 FROM saved_posts WHERE post_id = p.id AND profile_id = ? AND deleted_at IS NULL) as is_saved,
        (SELECT 1 FROM follows WHERE follower_profile_id = ? AND following_profile_id = p.profile_id
           AND status = 'accepted' AND deleted_at IS NULL) as is_following
      FROM posts p
      INNER JOIN profiles pr ON p.profile_id = pr.id
      WHERE p.deleted_at IS NULL AND pr.deleted_at IS NULL
        AND (
          (p.profile_id = ? AND p.id = (
            SELECT id FROM posts WHERE profile_id = ? AND deleted_at IS NULL
            ORDER BY created_at DESC LIMIT 1
          ))
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_profile_id = ? AND f.following_profile_id = p.profile_id
              AND f.status = 'accepted' AND f.deleted_at IS NULL
          )
          OR (NOT pr.is_private AND p.profile_id != ?)
        )
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`,
      [
        currentProfileId, currentProfileId, currentProfileId,
        currentProfileId,
        currentProfileId, currentProfileId, currentProfileId,
        currentProfileId, currentProfileId,
        currentProfileId,
        currentProfileId,
        limit, offset
      ]
    );
  },

  /**
   * Converte una riga raw FeedPostWithDetails nel formato FeedPostForAPI.
   * Converte tutti i valori numerici (0/1) in booleani JavaScript.
   *
   * @param post - Riga raw dal database
   * @param media - Media del post (già caricati separatamente)
   * @returns Post nel formato pronto per l'API
   */
  convertFeedPostForAPI(post: FeedPostWithDetails, media: PostMedia[]): FeedPostForAPI {
    return {
      id: post.id, profile_id: post.profile_id, caption: post.caption, location: post.location,
      is_comments_disabled: Boolean(post.is_comments_disabled),
      is_likes_hidden: Boolean(post.is_likes_hidden),
      likes_count: post.likes_count, comments_count: post.comments_count, created_at: post.created_at,
      profile_username: post.profile_username, profile_full_name: post.profile_full_name,
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
   * Converte un ReelWithDetails nel formato Reel dell'API.
   *
   * @param reel - Riga raw dal database
   * @param media - Media del reel
   * @returns Reel nel formato API
   */
  convertReelForAPI(reel: ReelWithDetails, media: PostMedia[]): import('@/types/feed').Reel {
    return {
      id: reel.id, profile_id: reel.profile_id, caption: reel.caption, location: reel.location,
      is_comments_disabled: reel.is_comments_disabled, is_likes_hidden: reel.is_likes_hidden,
      likes_count: reel.likes_count, comments_count: reel.comments_count, created_at: reel.created_at,
      profile_username: reel.profile_username, profile_full_name: reel.profile_full_name,
      profile_image_url: reel.profile_image_url, profile_is_verified: reel.profile_is_verified,
      is_liked_by_current_user: reel.is_liked,
      is_saved_by_current_user: reel.is_saved,
      media,
    };
  },

  /**
   * Converte un PostForView nel formato FeedPost dell'API.
   * Usato nella pagina di dettaglio del singolo post.
   *
   * @param post - Riga raw dal database
   * @param media - Media del post
   * @returns FeedPost nel formato API
   */
  convertPostForViewToAPI(post: PostForView, media: PostMedia[]): import('@/types/feed').FeedPost {
    return {
      id: post.id, profile_id: post.profile_id, caption: post.caption, location: post.location,
      is_comments_disabled: post.is_comments_disabled, is_likes_hidden: post.is_likes_hidden,
      likes_count: post.likes_count, comments_count: post.comments_count, created_at: post.created_at,
      profile_username: post.profile_username, profile_full_name: post.profile_full_name,
      profile_image_url: post.profile_image_url, profile_is_verified: post.profile_is_verified,
      profile_is_private: post.profile_is_private,
      profile_has_active_story: false, profile_has_viewed_story: false, is_following_author: false,
      is_liked_by_current_user: post.is_liked,
      is_saved_by_current_user: post.is_saved,
      media,
    };
  },
};

export default postRepository;
