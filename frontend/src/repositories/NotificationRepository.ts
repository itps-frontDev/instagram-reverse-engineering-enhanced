/**
 * @fileoverview Notification Repository (Repository Pattern)
 * 
 * Gestisce tutte le operazioni database relative alle notifiche.
 * Le notifiche informano gli utenti di attività relative al loro account.
 * 
 * TIPI DI NOTIFICHE:
 * - like: qualcuno ha messo like a un tuo post
 * - comment: qualcuno ha commentato un tuo post
 * - follow: qualcuno ha iniziato a seguirti
 * - follow_request: qualcuno vuole seguirti (profilo privato)
 * - mention: qualcuno ti ha menzionato
 * - tag: qualcuno ti ha taggato in una foto
 * 
 * @module repositories/NotificationRepository
 * 
 * @example
 * import { notificationRepository } from '@/repositories';
 * 
 * // Ottieni notifiche non lette
 * const notifications = await notificationRepository.getUnread(profileId);
 * 
 * // Crea notifica di like
 * await notificationRepository.create({
 *   recipient_profile_id: postOwnerId,
 *   actor_profile_id: likerProfileId,
 *   type: 'like',
 *   post_id: postId
 * });
 */

import { queryOne, queryAll, execute } from '@/lib/db';

// ============================================================================
// TIPI
// ============================================================================

/**
 * Tipi di notifica supportati.
 * Ogni tipo ha una logica di rendering diversa nel frontend.
 */
export type NotificationType = 
  | 'like_post'      // Like su post
  | 'like_comment'   // Like su commento
  | 'like_story'     // Like su storia
  | 'comment'        // Commento su post
  | 'comment_reply'  // Risposta a commento
  | 'follow'         // Nuovo follower
  | 'follow_request' // Richiesta di follow (profilo privato)
  | 'follow_accepted'// Richiesta di follow accettata
  | 'mention_post'   // Menzione in caption post
  | 'mention_comment'// Menzione in commento
  | 'mention_story'  // Menzione in storia
  | 'tag'            // Tag in una foto
  | 'message'        // Nuovo messaggio
  | 'story_view';    // Visualizzazione storia

/**
 * Notifica base dal database.
 */
export interface Notification {
  id: number;
  /** Profilo che riceve la notifica */
  recipient_profile_id: number;
  /** Profilo che ha generato la notifica */
  actor_profile_id: number;
  /** Tipo di notifica */
  type: NotificationType;
  /** Post correlato (opzionale) */
  post_id: number | null;
  /** Commento correlato (opzionale) */
  comment_id: number | null;
  /** Se la notifica è stata letta */
  is_read: boolean;
  created_at: string;
}

/**
 * Notifica con informazioni dell'attore.
 * Usata per il rendering nel frontend.
 */
export interface NotificationWithActor extends Notification {
  /** Username dell'attore */
  actor_username: string;
  /** Nome completo dell'attore */
  actor_full_name: string | null;
  /** Immagine profilo dell'attore */
  actor_profile_image_url: string | null;
  /** Se l'attore è verificato */
  actor_is_verified: boolean;
  /** URL del primo media del post (per thumbnail) */
  post_media_url?: string | null;
}

/**
 * Dati per creare una nuova notifica.
 */
export interface CreateNotificationData {
  recipient_profile_id: number;
  sender_profile_id: number;
  type: NotificationType;
  reference_type?: 'post' | 'comment' | 'story' | 'profile';
  reference_id?: number;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per le operazioni sulle notifiche.
 */
export const notificationRepository = {
  /**
   * Crea una nuova notifica.
   * 
   * NOTA: Non crea notifiche se actor === recipient (no auto-notifiche).
   * 
   * @param data - Dati della notifica
   * @returns ID della notifica creata, o null se non creata
   */
  async create(data: CreateNotificationData): Promise<number | null> {
    // Evita auto-notifiche
    if (data.recipient_profile_id === data.sender_profile_id) {
      return null;
    }

    // Evita notifiche duplicate recenti (stesso tipo, stesso attore, stesso riferimento)
    const recent = await queryOne(
      `SELECT 1 FROM notifications
       WHERE recipient_profile_id = ?
         AND sender_profile_id = ?
         AND type = ?
         AND (reference_id = ? OR (reference_id IS NULL AND ? IS NULL))
         AND (reference_type = ? OR (reference_type IS NULL AND ? IS NULL))
         AND created_at > datetime('now', '-1 hour')`,
      [
        data.recipient_profile_id,
        data.sender_profile_id,
        data.type,
        data.reference_id || null,
        data.reference_id || null,
        data.reference_type || null,
        data.reference_type || null,
      ]
    );

    if (recent) return null;

    const result = await execute(
      `INSERT INTO notifications (recipient_profile_id, sender_profile_id, type, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.recipient_profile_id,
        data.sender_profile_id,
        data.type,
        data.reference_type || null,
        data.reference_id || null,
      ]
    );

    return result.lastID;
  },

  /**
   * Ottiene le notifiche di un profilo.
   * Include informazioni sull'attore e thumbnail del post.
   * 
   * @param profileId - ID del profilo destinatario
   * @param limit - Numero massimo risultati
   * @param offset - Offset per paginazione
   * @returns Array di notifiche con attore
   */
  async getByProfileId(
    profileId: number,
    limit = 50,
    offset = 0
  ): Promise<NotificationWithActor[]> {
    const notifications = await queryAll<NotificationWithActor>(
      `SELECT
        n.id,
        n.recipient_profile_id,
        n.sender_profile_id as actor_profile_id,
        n.type,
        n.reference_type,
        n.reference_id,
        CASE 
          WHEN n.reference_type = 'post' THEN n.reference_id
          ELSE NULL
        END as post_id,
        CASE 
          WHEN n.reference_type = 'comment' THEN n.reference_id
          ELSE NULL
        END as comment_id,
        n.is_read,
        n.created_at,
        p.username AS actor_username,
        p.full_name AS actor_full_name,
        p.profile_image_url AS actor_profile_image_url,
        p.is_verified AS actor_is_verified,
        (SELECT media_url FROM post_media pm INNER JOIN posts po ON pm.post_id = po.id WHERE po.id = CASE WHEN n.reference_type = 'post' THEN n.reference_id ELSE NULL END ORDER BY pm.position LIMIT 1) AS post_media_url
       FROM notifications n
       LEFT JOIN profiles p ON n.sender_profile_id = p.id
       WHERE n.recipient_profile_id = ?
       ORDER BY n.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );

    return notifications.map(n => ({
      ...n,
      is_read: Boolean(n.is_read),
      actor_is_verified: Boolean(n.actor_is_verified),
    }));
  },

  /**
   * Ottiene le notifiche non lette di un profilo.
   * 
   * @param profileId - ID del profilo
   * @param limit - Numero massimo risultati
   * @returns Array di notifiche non lette
   */
  async getUnread(profileId: number, limit = 50): Promise<NotificationWithActor[]> {
    const notifications = await queryAll<NotificationWithActor>(
      `SELECT
        n.id,
        n.recipient_profile_id,
        n.actor_profile_id,
        n.type,
        n.post_id,
        n.comment_id,
        n.is_read,
        n.created_at,
        p.username AS actor_username,
        p.full_name AS actor_full_name,
        p.profile_image_url AS actor_profile_image_url,
        p.is_verified AS actor_is_verified,
        (SELECT media_url FROM post_media WHERE post_id = n.post_id ORDER BY position LIMIT 1) AS post_media_url
       FROM notifications n
       INNER JOIN profiles p ON n.actor_profile_id = p.id
       WHERE n.recipient_profile_id = ?
         AND n.is_read = 0
         AND p.deleted_at IS NULL
       ORDER BY n.created_at DESC
       LIMIT ?`,
      [profileId, limit]
    );

    return notifications.map(n => ({
      ...n,
      is_read: false,
      actor_is_verified: Boolean(n.actor_is_verified),
    }));
  },

  /**
   * Conta le notifiche non lette.
   * Usato per mostrare il badge nel menu.
   * 
   * @param profileId - ID del profilo
   * @returns Numero di notifiche non lette
   */
  async getUnreadCount(profileId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE recipient_profile_id = ?
         AND is_read = 0`,
      [profileId]
    );
    return result?.count || 0;
  },

  /**
   * Segna una notifica come letta.
   * 
   * @param id - ID della notifica
   * @param profileId - ID del profilo (per sicurezza)
   * @returns true se aggiornata
   */
  async markAsRead(id: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE id = ? AND recipient_profile_id = ?`,
      [id, profileId]
    );
    return result.changes > 0;
  },

  /**
   * Segna tutte le notifiche come lette.
   * Usato quando l'utente apre il pannello notifiche.
   * 
   * @param profileId - ID del profilo
   * @returns Numero di notifiche aggiornate
   */
  async markAllAsRead(profileId: number): Promise<number> {
    const result = await execute(
      `UPDATE notifications
       SET is_read = 1
       WHERE recipient_profile_id = ? AND is_read = 0`,
      [profileId]
    );
    return result.changes;
  },

  /**
   * Elimina una notifica (hard delete, la tabella non supporta soft delete).
   * 
   * @param id - ID della notifica
   * @param profileId - ID del profilo (per sicurezza)
   * @returns true se eliminata
   */
  async delete(id: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `DELETE FROM notifications
       WHERE id = ? AND recipient_profile_id = ?`,
      [id, profileId]
    );
    return result.changes > 0;
  },

  /**
   * Elimina le notifiche relative a un post (hard delete).
   * Chiamare quando un post viene eliminato.
   * 
   * @param postId - ID del post
   * @returns Numero di notifiche eliminate
   */
  async deleteByPostId(postId: number): Promise<number> {
    const result = await execute(
      `DELETE FROM notifications
       WHERE post_id = ?`,
      [postId]
    );
    return result.changes;
  },

  /**
   * Elimina le notifiche di follow tra due profili (hard delete).
   * Chiamare quando un utente smette di seguire qualcuno.
   * 
   * @param actorProfileId - Chi ha fatto il follow
   * @param recipientProfileId - Chi ha ricevuto il follow
   * @returns true se eliminate
   */
  async deleteFollowNotification(
    actorProfileId: number,
    recipientProfileId: number
  ): Promise<boolean> {
    const result = await execute(
      `DELETE FROM notifications
       WHERE sender_profile_id = ?
         AND recipient_profile_id = ?
         AND type IN ('follow', 'follow_request')`,
      [actorProfileId, recipientProfileId]
    );
    return result.changes > 0;
  },

  /**
   * Elimina le notifiche di like per un post specifico (hard delete).
   * Chiamare quando un utente rimuove il like da un post.
   * 
   * @param actorProfileId - Chi ha messo il like
   * @param postId - ID del post
   * @returns true se eliminate
   */
  async deleteLikeNotification(
    actorProfileId: number,
    referenceId: number,
    referenceType: 'post' | 'comment' | 'story' = 'post'
  ): Promise<boolean> {
    let likeType: string;
    if (referenceType === 'post') {
      likeType = 'like_post';
    } else if (referenceType === 'comment') {
      likeType = 'like_comment';
    } else {
      likeType = 'like_story';
    }
    
    const result = await execute(
      `DELETE FROM notifications
       WHERE sender_profile_id = ?
         AND reference_id = ?
         AND reference_type = ?
         AND type = ?`,
      [actorProfileId, referenceId, referenceType, likeType]
    );
    return result.changes > 0;
  },

  // ==========================================================================
  // HELPER PER CREARE NOTIFICHE SPECIFICHE
  // ==========================================================================

  /**
   * Crea notifica di like.
   * Chiamare quando qualcuno mette like a un post.
   */
  async createLikeNotification(
    postOwnerId: number,
    likerId: number,
    postId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: postOwnerId,
      sender_profile_id: likerId,
      type: 'like_post',
      reference_type: 'post',
      reference_id: postId,
    });
  },

  /**
   * Crea notifica di like a una storia.
   * Chiamare quando qualcuno mette like a una storia.
   */
  async createLikeStoryNotification(
    storyOwnerId: number,
    likerId: number,
    storyId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: storyOwnerId,
      sender_profile_id: likerId,
      type: 'like_story',
      reference_type: 'story',
      reference_id: storyId,
    });
  },

  /**
   * Crea notifica di commento.
   * Chiamare quando qualcuno commenta un post.
   */
  async createCommentNotification(
    postOwnerId: number,
    commenterId: number,
    postId: number,
    commentId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: postOwnerId,
      sender_profile_id: commenterId,
      type: 'comment',
      reference_type: 'comment',
      reference_id: commentId,
    });
  },

  /**
   * Crea notifica di nuovo follower.
   * Chiamare quando qualcuno inizia a seguire un profilo pubblico.
   */
  async createFollowNotification(
    followedId: number,
    followerId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: followedId,
      sender_profile_id: followerId,
      type: 'follow',
      reference_type: 'profile',
      reference_id: followerId,
    });
  },

  /**
   * Crea notifica di richiesta follow.
   * Chiamare quando qualcuno richiede di seguire un profilo privato.
   */
  async createFollowRequestNotification(
    requestedId: number,
    requesterId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: requestedId,
      sender_profile_id: requesterId,
      type: 'follow_request',
      reference_type: 'profile',
      reference_id: requesterId,
    });
  },

  /**
   * Crea notifica di menzione.
   * Chiamare quando qualcuno viene menzionato (@username).
   */
  async createMentionNotification(
    mentionedId: number,
    mentionerId: number,
    postId?: number,
    commentId?: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: mentionedId,
      sender_profile_id: mentionerId,
      type: commentId ? 'mention_comment' : 'mention_post',
      reference_type: commentId ? 'comment' : 'post',
      reference_id: commentId || postId,
    });
  },

  /**
   * Crea notifica di tag in foto.
   * Chiamare quando qualcuno viene taggato in un post.
   */
  async createTagNotification(
    taggedId: number,
    taggerId: number,
    postId: number
  ): Promise<number | null> {
    return this.create({
      recipient_profile_id: taggedId,
      sender_profile_id: taggerId,
      type: 'tag',
      reference_type: 'post',
      reference_id: postId,
    });
  },

  /**
   * Crea notifica di richiesta follow accettata.
   * Chiamare quando qualcuno accetta una richiesta di follow.
   */
  async createFollowAcceptedNotification(
    requesterId: number,
    accepterId: number
  ): Promise<number | null> {
    // Prima elimina eventuali notifiche duplicate
    await execute(
      `DELETE FROM notifications
       WHERE recipient_profile_id = ?
         AND sender_profile_id = ?
         AND type = 'follow_accepted'`,
      [requesterId, accepterId]
    );

    // Crea la nuova notifica usando INSERT diretto (non la create() base)
    // perché vogliamo sempre creare questa notifica specifica
    const result = await execute(
      `INSERT INTO notifications (recipient_profile_id, sender_profile_id, type, reference_type, reference_id)
       VALUES (?, ?, 'follow_accepted', 'profile', ?)`,
      [requesterId, accepterId, accepterId]
    );

    return result.lastID;
  },

  /**
   * Aggiorna il tipo di notifica da follow_request a follow.
   * Chiamare quando una richiesta di follow viene accettata.
   * 
   * @param senderId - Chi ha fatto la richiesta (follower)
   * @param recipientId - Chi ha accettato (following)
   * @returns true se aggiornata
   */
  async convertFollowRequestToFollow(
    senderId: number,
    recipientId: number
  ): Promise<boolean> {
    const result = await execute(
      `UPDATE notifications
       SET type = 'follow'
       WHERE sender_profile_id = ?
         AND recipient_profile_id = ?
         AND type = 'follow_request'`,
      [senderId, recipientId]
    );
    return result.changes > 0;
  },

  /**
   * Elimina le notifiche di follow_request e follow tra due profili.
   * Chiamare quando una richiesta viene rifiutata.
   * 
   * @param senderId - Chi ha fatto la richiesta
   * @param recipientId - Chi ha ricevuto la richiesta
   * @returns true se eliminate
   */
  async deleteFollowRequestNotifications(
    senderId: number,
    recipientId: number
  ): Promise<boolean> {
    const result = await execute(
      `DELETE FROM notifications
       WHERE sender_profile_id = ?
         AND recipient_profile_id = ?
         AND (type = 'follow_request' OR type = 'follow')`,
      [senderId, recipientId]
    );
    return result.changes > 0;
  },

  /**
   * Ottiene le notifiche in formato legacy (per compatibilità frontend).
   * Usa sender_profile_id e reference_type/reference_id invece del formato standard.
   * 
   * @param profileId - ID del profilo destinatario
   * @param limit - Numero massimo risultati
   * @returns Array di notifiche in formato legacy
   */
  async getByProfileIdLegacy(profileId: number, limit = 50): Promise<{
    id: number;
    type: string;
    sender_profile_id: number | null;
    sender_username: string | null;
    sender_full_name: string | null;
    sender_profile_image_url: string | null;
    sender_is_verified: boolean;
    reference_type: string | null;
    reference_id: number | null;
    reference_post_id: number | null; // ID del post (anche per commenti)
    reference_image_url: string | null;
    reference_media_type: string | null;
    is_read: boolean;
    created_at: string;
  }[]> {
    const rows = await queryAll<{
      id: number;
      type: string;
      sender_profile_id: number | null;
      sender_username: string | null;
      sender_full_name: string | null;
      sender_profile_image_url: string | null;
      sender_is_verified: number;
      reference_type: string | null;
      reference_id: number | null;
      reference_post_id: number | null;
      reference_image_url: string | null;
      reference_media_type: string | null;
      is_read: number;
      created_at: string;
    }>(
      `SELECT
        n.id,
        n.type,
        n.sender_profile_id,
        n.reference_type,
        n.reference_id,
        CASE 
          WHEN n.reference_type = 'post' THEN n.reference_id
          WHEN n.reference_type = 'comment' THEN c.post_id
          ELSE NULL
        END as reference_post_id,
        n.is_read,
        n.created_at,
        p.username as sender_username,
        p.full_name as sender_full_name,
        p.profile_image_url as sender_profile_image_url,
        COALESCE(p.is_verified, 0) as sender_is_verified,
        COALESCE(pm_post.media_url, pm_comment.media_url, s.media_url) as reference_image_url,
        COALESCE(pm_post.media_type, pm_comment.media_type, s.media_type) as reference_media_type
      FROM notifications n
      LEFT JOIN profiles p ON n.sender_profile_id = p.id AND p.deleted_at IS NULL
      LEFT JOIN posts ON n.reference_type = 'post' AND n.reference_id = posts.id AND posts.deleted_at IS NULL
      LEFT JOIN post_media pm_post ON posts.id = pm_post.post_id AND pm_post.position = 0 AND pm_post.deleted_at IS NULL
      LEFT JOIN comments c ON n.reference_type = 'comment' AND n.reference_id = c.id AND c.deleted_at IS NULL
      LEFT JOIN posts posts_from_comment ON c.post_id = posts_from_comment.id AND posts_from_comment.deleted_at IS NULL
      LEFT JOIN post_media pm_comment ON posts_from_comment.id = pm_comment.post_id AND pm_comment.position = 0 AND pm_comment.deleted_at IS NULL
      LEFT JOIN stories s ON n.reference_type = 'story' AND n.reference_id = s.id AND s.deleted_at IS NULL
      WHERE n.recipient_profile_id = ?
      ORDER BY n.created_at DESC
      LIMIT ?`,
      [profileId, limit]
    );

    return rows.map(row => ({
      ...row,
      is_read: row.is_read === 1,
      sender_is_verified: row.sender_is_verified === 1,
    }));
  },
};

export default notificationRepository;
