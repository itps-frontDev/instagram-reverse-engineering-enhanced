/**
 * @fileoverview Comment Repository (Repository Pattern)
 *
 * Gestisce tutte le operazioni database relative ai commenti sui post.
 * Include creazione, eliminazione, like/unlike e recupero con profilo autore.
 *
 * STRUTTURA DATABASE:
 * - comments: testo, profilo, post, parent (per risposte), contatori
 * - likes: like polimorfici (likeable_type='comment', soft delete con deleted_at)
 *
 *
 * AUTORIZZAZIONE ELIMINAZIONE:
 * Un commento può essere eliminato dal suo autore O dal proprietario del post.
 *
 * @module repositories/CommentRepository
 *
 * @example
 * import { commentRepository } from '@/repositories';
 *
 * // Crea un commento
 * const comment = await commentRepository.create(postId, profileId, 'Bello!');
 *
 */

import { queryAll, queryOne, execute } from '@/lib/db';

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

export interface CommentBase {
  id: number;
  post_id: number;
  profile_id: number;
  parent_id: number | null;
  content: string;
  likes_count: number;
  created_at: string;
}

export interface PostForComment {
  id: number;
  comments_disabled: boolean;
  comments_count: number;
  profile_id: number;
}

export interface CommentDeleteResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// REPOSITORY
// ============================================================================

class CommentRepository {

  /**
   * Trova un commento per ID.
   *
   * @param commentId - ID del commento
   * @returns CommentBase o null se non trovato/eliminato
   */
  async getById(commentId: number): Promise<CommentBase | null> {
    const comment = await queryOne<Comment>(
      `SELECT id, post_id, profile_id, parent_id, text, likes_count, created_at
       FROM comments WHERE id = ? AND deleted_at IS NULL`,
      [commentId]
    );
    if (!comment) return null;
    return {
      id: comment.id, post_id: comment.post_id, profile_id: comment.profile_id,
      parent_id: comment.parent_id, content: comment.text,
      likes_count: comment.likes_count, created_at: comment.created_at,
    };
  }

  /**
   * Ottiene i commenti di un post con dati del profilo autore.
   * Include is_liked del viewer e stato delle storie del profilo.
   *
   * NOTA SULLE STORIE NEI COMMENTI:
   * profile_has_active_story considera se il viewer può vedere le storie
   * (proprio profilo, following, o profilo pubblico) E se non le ha ancora viste.
   *
   * @param postId - ID del post
   * @param currentProfileId - ID del profilo viewer (per is_liked e storie)
   * @param limit - Numero massimo di risultati
   * @param offset - Offset per paginazione
   * @returns Array di commenti con profilo e flag viewer
   */
  async getForPost(
    postId: number,
    currentProfileId: number,
    limit = 20,
    offset = 0
  ): Promise<CommentWithProfile[]> {
    const comments = await queryAll<any>(
      `SELECT
        c.id, c.post_id, c.profile_id, c.parent_id, c.text, c.likes_count, c.created_at,
        p.username as profile_username,
        p.full_name as profile_full_name,
        p.profile_image_url,
        p.is_verified as profile_is_verified,
        p.is_private as profile_is_private,
        (
          SELECT CASE
            WHEN COUNT(*) > 0 AND EXISTS (
              SELECT 1 FROM stories s2
              WHERE s2.profile_id = p.id AND s2.deleted_at IS NULL AND s2.expires_at > NOW()
                AND (
                  s2.profile_id = ? OR
                  s2.profile_id IN (
                    SELECT following_profile_id FROM follows
                    WHERE follower_profile_id = ? AND status = 'accepted'
                  ) OR NOT p.is_private
                )
                AND NOT EXISTS (
                  SELECT 1 FROM story_views sv WHERE sv.story_id = s2.id AND sv.viewer_profile_id = ?
                )
            ) THEN 1 ELSE 0 END
          FROM stories s WHERE s.profile_id = p.id AND s.expires_at > NOW() AND s.deleted_at IS NULL
        ) as profile_has_active_story,
        (SELECT COUNT(*) > 0
         FROM story_views sv
         INNER JOIN stories s ON s.id = sv.story_id
         WHERE s.profile_id = p.id AND sv.viewer_profile_id = ?
           AND s.deleted_at IS NULL AND s.expires_at > NOW()
        ) as profile_has_viewed_story,
        (SELECT 1 FROM likes WHERE likeable_type = 'comment' AND likeable_id = c.id AND profile_id = ? AND deleted_at IS NULL) as is_liked
      FROM comments c
      INNER JOIN profiles p ON c.profile_id = p.id
      WHERE c.post_id = ? AND c.deleted_at IS NULL AND p.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, currentProfileId, postId, limit, offset]
    );

    return comments.map((c: any) => ({
      id: c.id, post_id: c.post_id, profile_id: c.profile_id, parent_id: c.parent_id,
      text: c.text, likes_count: c.likes_count, created_at: c.created_at,
      profile_username: c.profile_username, profile_full_name: c.profile_full_name,
      profile_image_url: c.profile_image_url,
      profile_is_verified: Boolean(c.profile_is_verified),
      profile_is_private: Boolean(c.profile_is_private),
      profile_has_active_story: Boolean(c.profile_has_active_story),
      profile_has_viewed_story: Boolean(c.profile_has_viewed_story),
      is_liked: Boolean(c.is_liked),
    }));
  }

  /**
   * Recupera le informazioni del post necessarie per validare un commento.
   * Verifica se i commenti sono disabilitati prima di permettere la creazione.
   *
   * @param postId - ID del post
   * @returns Dati del post o null se non trovato
   */
  async getPostInfo(postId: number): Promise<PostForComment | null> {
    const post = await queryOne<{
      id: number; is_comments_disabled: boolean; comments_count: number; profile_id: number;
    }>(
      'SELECT id, is_comments_disabled, comments_count, profile_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [postId]
    );
    if (!post) return null;
    return {
      id: post.id, comments_disabled: Boolean(post.is_comments_disabled),
      comments_count: post.comments_count, profile_id: post.profile_id,
    };
  }

  /**
   * Verifica se un commento padre esiste nello stesso post.
   * Usato per validare le risposte ai commenti (parent_id).
   *
   * @param commentId - ID del commento padre
   * @param postId - ID del post (per sicurezza: evita cross-post)
   * @returns true se il commento padre esiste nel post
   */
  async parentExists(commentId: number, postId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT id FROM comments WHERE id = ? AND post_id = ? AND deleted_at IS NULL`,
      [commentId, postId]
    );
    return result !== null;
  }

  /**
   * Crea un nuovo commento e aggiorna il contatore del post.
   * Per le risposte (parentId != null), il contatore del post NON viene incrementato.
   * Dopo l'insert, recupera il commento completo con dati del profilo.
   *
   * @param postId - ID del post
   * @param profileId - ID del profilo autore
   * @param text - Testo del commento
   * @param parentId - ID del commento padre (per risposte, opzionale)
   * @returns Commento creato con dati del profilo
   */
  async create(postId: number, profileId: number, text: string, parentId?: number): Promise<CommentWithProfile> {
    const result = await execute(
      `INSERT INTO comments (post_id, profile_id, parent_id, text) VALUES (?, ?, ?, ?) RETURNING id`,
      [postId, profileId, parentId || null, text]
    );

    if (!parentId) {
      await execute(`UPDATE posts SET comments_count = comments_count + 1 WHERE id = ?`, [postId]);
    }

    const comment = await queryOne<any>(
      `SELECT c.id, c.post_id, c.profile_id, c.parent_id, c.text, c.likes_count, c.created_at,
        p.username as profile_username, p.full_name as profile_full_name,
        p.profile_image_url, p.is_verified as profile_is_verified, p.is_private as profile_is_private,
        FALSE as is_liked, FALSE as profile_has_active_story
       FROM comments c INNER JOIN profiles p ON c.profile_id = p.id WHERE c.id = ?`,
      [result.lastID]
    );

    if (!comment) throw new Error('Impossibile recuperare il commento creato');

    return {
      id: comment.id, post_id: comment.post_id, profile_id: comment.profile_id,
      parent_id: comment.parent_id, text: comment.text, likes_count: comment.likes_count,
      created_at: comment.created_at, profile_username: comment.profile_username,
      profile_full_name: comment.profile_full_name, profile_image_url: comment.profile_image_url,
      profile_is_verified: Boolean(comment.profile_is_verified),
      profile_is_private: Boolean(comment.profile_is_private),
      profile_has_active_story: false, profile_has_viewed_story: false, is_liked: false,
    };
  }

  /**
   * Elimina un commento con verifica autorizzazione.
   * Può eliminare: l'autore del commento O il proprietario del post.
   * Se il commento non è una risposta, decrementa il comments_count del post.
   *
   * @param commentId - ID del commento da eliminare
   * @param requestingProfileId - ID del profilo che richiede l'eliminazione
   * @returns { success: true } o { success: false, error: string }
   */
  async deleteWithAuth(commentId: number, requestingProfileId: number): Promise<CommentDeleteResult> {
    const comment = await queryOne<{ id: number; profile_id: number; post_id: number; parent_id: number | null }>(
      'SELECT id, profile_id, post_id, parent_id FROM comments WHERE id = ? AND deleted_at IS NULL',
      [commentId]
    );
    if (!comment) return { success: false, error: 'Commento non trovato' };

    const post = await queryOne<{ profile_id: number }>(
      'SELECT profile_id FROM posts WHERE id = ? AND deleted_at IS NULL',
      [comment.post_id]
    );

    if (comment.profile_id !== requestingProfileId && !(post && post.profile_id === requestingProfileId)) {
      return { success: false, error: 'Non autorizzato' };
    }

    await execute(`UPDATE comments SET deleted_at = NOW() WHERE id = ?`, [commentId]);

    if (!comment.parent_id) {
      await execute(`UPDATE posts SET comments_count = comments_count - 1 WHERE id = ?`, [comment.post_id]);
    }
    return { success: true };
  }

}

export const commentRepository = new CommentRepository();
export default commentRepository;
