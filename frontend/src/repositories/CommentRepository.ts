/**
 * @fileoverview Repository per la gestione dei commenti
 * 
 * Gestisce tutte le operazioni database relative ai commenti sui post.
 * Centralizza creazione, lettura, aggiornamento e cancellazione commenti,
 * oltre alla gestione dei like sui commenti.
 * 
 * STRUTTURA DATABASE CORRELATA:
 * - comments: commenti sui post
 * - likes: like sui commenti (polymorphic)
 * - profiles: informazioni autori commenti
 * 
 * PATTERN REPOSITORY:
 * Separa la logica di accesso ai dati dalla logica di business,
 * permettendo di testare e modificare l'implementazione in modo indipendente.
 * 
 * @module repositories/CommentRepository
 * 
 * @example
 * import { commentRepository } from '@/repositories';
 * 
 * // Ottieni commenti di un post
 * const comments = await commentRepository.getForPost(postId, profileId);
 * 
 * // Crea un nuovo commento
 * const comment = await commentRepository.create(postId, profileId, 'Bel post!');
 * 
 * // Like su un commento
 * await commentRepository.like(commentId, profileId);
 */

import { queryAll, queryOne, execute } from '@/lib/db';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Commento su un post.
 */
export interface Comment {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  text: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Commento con dati del profilo autore.
 */
export interface CommentWithProfile {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  text: string;
  likes_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  profile_is_private: boolean;
  profile_has_active_story: boolean;
  profile_has_viewed_story: boolean;
  is_liked: boolean;
}

/**
 * Dati base di un commento.
 */
export interface CommentBase {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
}

/**
 * Informazioni sul post per validazione commenti.
 */
export interface PostForComment {
  id: number;
  comments_disabled: boolean;
  comments_count: number;
  profile_id: number;
}

/**
 * Risultato operazione di like su commento.
 */
export interface CommentLikeResult {
  success: boolean;
  newLikesCount: number;
}

/**
 * Risultato operazione delete commento.
 */
export interface CommentDeleteResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per la gestione dei commenti.
 * Implementa il pattern Repository per centralizzare l'accesso ai dati.
 */
class CommentRepository {
  
  // ==========================================================================
  // OPERAZIONI LETTURA
  // ==========================================================================

  /**
   * Recupera un commento per ID.
   * 
   * @param commentId - ID del commento
   * @returns Commento con dati base oppure null se non trovato
   */
  async getById(commentId: number): Promise<CommentBase | null> {
    const comment = await queryOne<Comment>(
      `SELECT id, post_id, profile_id, parent_id, text, likes_count, created_at
       FROM comments
       WHERE id = ? AND deleted_at IS NULL`,
      [commentId]
    );
    
    if (!comment) return null;
    
    return {
      id: comment.id,
      post_id: comment.post_id,
      profile_id: comment.profile_id,
      parent_id: comment.parent_id,
      content: comment.text,
      likes_count: comment.likes_count,
      created_at: comment.created_at,
    };
  }

  /**
   * Recupera tutti i commenti di un post con dati profilo.
   * Include informazioni su like, story attive e profilo verificato.
   * 
   * @param postId - ID del post
   * @param currentProfileId - ID del profilo corrente (per is_liked)
   * @param limit - Numero massimo di commenti
   * @param offset - Offset per paginazione
   * @returns Array di commenti con dati profilo
   */
  async getForPost(
    postId: number, 
    currentProfileId: number, 
    limit = 20, 
    offset = 0
  ): Promise<CommentWithProfile[]> {
    const comments = await queryAll<any>(
      `SELECT
        c.id,
        c.post_id,
        c.profile_id,
        c.parent_id,
        c.text,
        c.likes_count,
        c.created_at,
        p.username as profile_username,
        p.full_name as profile_full_name,
        p.profile_image_url,
        p.is_verified as profile_is_verified,
        p.is_private as profile_is_private,
        (
          SELECT CASE 
            WHEN COUNT(*) > 0 AND EXISTS (
              SELECT 1 FROM stories s2
              WHERE s2.profile_id = p.id
              AND s2.deleted_at IS NULL
              AND s2.expires_at > datetime('now')
              AND (
                s2.profile_id = ? OR
                s2.profile_id IN (
                  SELECT following_profile_id FROM follows
                  WHERE follower_profile_id = ?
                  AND status = 'accepted'
                ) OR
                p.is_private = 0
              )
              AND NOT EXISTS (
                SELECT 1 FROM story_views sv
                WHERE sv.story_id = s2.id
                AND sv.viewer_profile_id = ?
              )
            ) THEN 1 ELSE 0 END
          FROM stories s
          WHERE s.profile_id = p.id
            AND s.expires_at > datetime('now')
            AND s.deleted_at IS NULL
        ) as profile_has_active_story,
        (SELECT COUNT(*) > 0
         FROM story_views sv
         INNER JOIN stories s ON s.id = sv.story_id
         WHERE s.profile_id = p.id
           AND sv.viewer_profile_id = ?
           AND s.deleted_at IS NULL
           AND datetime(s.expires_at) > datetime('now')
        ) as profile_has_viewed_story,
        (SELECT 1 FROM likes
         WHERE likeable_type = 'comment'
         AND likeable_id = c.id
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked
      FROM comments c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE c.post_id = ?
        AND c.deleted_at IS NULL
        AND p.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, currentProfileId, postId, limit, offset]
    );

    return comments.map((c: any) => ({
      id: c.id,
      post_id: c.post_id,
      profile_id: c.profile_id,
      parent_id: c.parent_id,
      text: c.text,
      likes_count: c.likes_count,
      created_at: c.created_at,
      profile_username: c.profile_username,
      profile_full_name: c.profile_full_name,
      profile_image_url: c.profile_image_url,
      profile_is_verified: Boolean(c.profile_is_verified),
      profile_is_private: Boolean(c.profile_is_private),
      profile_has_active_story: Boolean(c.profile_has_active_story),
      profile_has_viewed_story: Boolean(c.profile_has_viewed_story),
      is_liked: Boolean(c.is_liked),
    }));
  }

  /**
   * Recupera informazioni sul post per validazione commenti.
   * 
   * @param postId - ID del post
   * @returns Dati post oppure null se non trovato
   */
  async getPostInfo(postId: number): Promise<PostForComment | null> {
    const post = await queryOne<{
      id: number;
      is_comments_disabled: number;
      comments_count: number;
      profile_id: number;
    }>(
      'SELECT id, is_comments_disabled, comments_count, profile_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );
    
    if (!post) return null;
    
    return {
      id: post.id,
      comments_disabled: Boolean(post.is_comments_disabled),
      comments_count: post.comments_count,
      profile_id: post.profile_id,
    };
  }

  /**
   * Verifica se un commento padre esiste.
   * 
   * @param commentId - ID del commento padre
   * @param postId - ID del post (per verificare che appartiene allo stesso post)
   * @returns true se esiste
   */
  async parentExists(commentId: number, postId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT id FROM comments WHERE id = ? AND post_id = ? AND deleted_at IS NULL`,
      [commentId, postId]
    );
    return result !== null;
  }

  // ==========================================================================
  // OPERAZIONI SCRITTURA
  // ==========================================================================

  /**
   * Crea un nuovo commento e restituisce i dati completi.
   * Incrementa automaticamente comments_count del post (solo per commenti top-level).
   * 
   * @param postId - ID del post
   * @param profileId - ID del profilo che commenta
   * @param text - Testo del commento
   * @param parentId - ID commento padre (opzionale)
   * @returns Commento creato con dati profilo
   */
  async create(
    postId: number, 
    profileId: number, 
    text: string, 
    parentId?: number
  ): Promise<CommentWithProfile> {
    // Inserisci commento
    const result = await execute(
      `INSERT INTO comments (post_id, profile_id, parent_id, text, created_at)
       VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
      [postId, profileId, parentId || null, text]
    );

    // Incrementa contatore solo per commenti top-level
    if (!parentId) {
      await execute(
        `UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?`,
        [postId]
      );
    }

    // Recupera commento creato con dati profilo
    const comment = await queryOne<any>(
      `SELECT
        c.id,
        c.post_id,
        c.profile_id,
        c.parent_id,
        c.text,
        c.likes_count,
        c.created_at,
        p.username as profile_username,
        p.full_name as profile_full_name,
        p.profile_image_url,
        p.is_verified as profile_is_verified,
        p.is_private as profile_is_private,
        0 as is_liked,
        0 as profile_has_active_story
      FROM comments c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE c.id = ?`,
      [result.lastID]
    );

    if (!comment) {
      throw new Error('Impossibile recuperare il commento creato');
    }

    return {
      id: comment.id,
      post_id: comment.post_id,
      profile_id: comment.profile_id,
      parent_id: comment.parent_id,
      text: comment.text,
      likes_count: comment.likes_count,
      created_at: comment.created_at,
      profile_username: comment.profile_username,
      profile_full_name: comment.profile_full_name,
      profile_image_url: comment.profile_image_url,
      profile_is_verified: Boolean(comment.profile_is_verified),
      profile_is_private: Boolean(comment.profile_is_private),
      profile_has_active_story: false,
      profile_has_viewed_story: false,
      is_liked: false,
    };
  }

  /**
   * Elimina un commento con controllo ownership.
   * Solo l'autore del commento o l'autore del post possono eliminare.
   * Decrementa comments_count del post se è un commento top-level.
   * 
   * @param commentId - ID del commento
   * @param requestingProfileId - ID del profilo che richiede la cancellazione
   * @returns Risultato operazione con eventuale errore
   */
  async deleteWithAuth(
    commentId: number, 
    requestingProfileId: number
  ): Promise<CommentDeleteResult> {
    // Trova il commento
    const comment = await queryOne<{ 
      id: number; 
      profile_id: number; 
      post_id: number; 
      parent_id: number | null 
    }>(
      'SELECT id, profile_id, post_id, parent_id FROM comments WHERE id = ? AND deleted_at IS NULL',
      [commentId]
    );

    if (!comment) {
      return { success: false, error: 'Commento non trovato' };
    }

    // Verifica ownership del post
    const post = await queryOne<{ profile_id: number }>(
      'SELECT profile_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [comment.post_id]
    );

    const isCommentOwner = comment.profile_id === requestingProfileId;
    const isPostOwner = post && post.profile_id === requestingProfileId;

    if (!isCommentOwner && !isPostOwner) {
      return { success: false, error: 'Non autorizzato' };
    }

    // Soft delete
    await execute(
      `UPDATE comments SET deleted_at = datetime('now', 'localtime') WHERE id = ?`,
      [commentId]
    );

    // Decrementa contatore solo se top-level
    if (!comment.parent_id) {
      await execute(
        `UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?`,
        [comment.post_id]
      );
    }

    return { success: true };
  }

  // ==========================================================================
  // OPERAZIONI LIKE
  // ==========================================================================

  /**
   * Mette like a un commento.
   * Incrementa automaticamente likes_count.
   * Supporta soft delete: riattiva il like se già esistente.
   * 
   * @param commentId - ID del commento
   * @param profileId - ID del profilo che mette like
   * @returns Risultato operazione oppure null se il like esiste già
   */
  async like(
    commentId: number, 
    profileId: number
  ): Promise<CommentLikeResult | null> {
    // Verifica se esiste già un like (attivo o cancellato)
    const existing = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM likes 
       WHERE profile_id = ? AND likeable_type = 'comment' AND likeable_id = ?
       ORDER BY created_at DESC LIMIT 1`,
      [profileId, commentId]
    );

    if (existing && !existing.deleted_at) {
      // Like già attivo
      return null;
    }

    if (existing && existing.deleted_at) {
      // Riattiva like esistente
      await execute(
        `UPDATE likes SET deleted_at = NULL WHERE id = ?`,
        [existing.id]
      );
    } else {
      // Crea nuovo like
      try {
        await execute(
          `INSERT INTO likes (profile_id, likeable_type, likeable_id) VALUES (?, 'comment', ?)`,
          [profileId, commentId]
        );
      } catch (error: any) {
        // Race condition: il like è stato creato da un'altra richiesta
        if (error.code === 'SQLITE_CONSTRAINT') {
          console.log('[Likes] Like già esistente (race condition), skip increment');
          return null;
        }
        throw error;
      }
    }

    // Incrementa contatore e ottieni nuovo valore
    await execute(
      `UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?`,
      [commentId]
    );

    const updated = await queryOne<{ likes_count: number }>(
      `SELECT likes_count FROM comments WHERE id = ?`,
      [commentId]
    );

    return { success: true, newLikesCount: updated?.likes_count || 0 };
  }

  /**
   * Toglie like da un commento.
   * Decrementa automaticamente likes_count.
   * 
   * @param commentId - ID del commento
   * @param profileId - ID del profilo
   * @returns Risultato operazione oppure null se non c'era like
   */
  async unlike(
    commentId: number, 
    profileId: number
  ): Promise<CommentLikeResult | null> {
    // Trova il like attivo
    const existingLike = await queryOne<{ id: number }>(
      `SELECT id FROM likes 
       WHERE profile_id = ? AND likeable_type = 'comment' AND likeable_id = ? AND deleted_at IS NULL`,
      [profileId, commentId]
    );

    if (!existingLike) {
      return null;
    }

    // Soft delete del like
    await execute(
      `UPDATE likes SET deleted_at = datetime('now', 'localtime') WHERE id = ?`,
      [existingLike.id]
    );

    // Decrementa contatore
    await execute(
      `UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?`,
      [commentId]
    );

    const updated = await queryOne<{ likes_count: number }>(
      `SELECT likes_count FROM comments WHERE id = ?`,
      [commentId]
    );

    return { success: true, newLikesCount: updated?.likes_count || 0 };
  }

  /**
   * Verifica se un profilo ha messo like a un commento.
   * 
   * @param commentId - ID del commento
   * @param profileId - ID del profilo
   * @returns true se ha like attivo
   */
  async hasLiked(commentId: number, profileId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT 1 FROM likes 
       WHERE profile_id = ? AND likeable_type = 'comment' AND likeable_id = ? AND deleted_at IS NULL`,
      [profileId, commentId]
    );
    return !!result; // Converti a boolean: null/undefined → false, oggetto → true
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const commentRepository = new CommentRepository();
export default commentRepository;
