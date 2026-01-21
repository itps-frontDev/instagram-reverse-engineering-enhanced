/**
 * @fileoverview Repository per la gestione delle Stories
 *
 * Incapsula tutte le operazioni database relative alle storie:
 * - Recupero storie attive (proprie, di profili seguiti, pubblici)
 * - Registrazione visualizzazioni
 * - Like/Unlike su storie
 * - Recupero lista viewers
 * - Creazione nuove storie
 *
 * PATTERN REPOSITORY:
 * Separa la logica di accesso ai dati dalla logica di business,
 * permettendo di testare e modificare l'implementazione in modo indipendente.
 *
 * @module repositories/StoryRepository
 */

import { queryOne, queryAll, execute } from '@/lib/db';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Rappresenta una storia nel database
 */
export interface Story {
  id: number;
  profile_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  views_count: number;
  created_at: string;
  expires_at: string;
  deleted_at: string | null;
}

/**
 * Storia con informazioni sul profilo autore
 */
export interface StoryWithProfile extends Story {
  username: string;
  profile_image_url: string | null;
  is_verified: boolean;
}

/**
 * Storia con stato visualizzazione/like per l'utente corrente
 */
export interface StoryWithStatus extends StoryWithProfile {
  is_liked_by_me: boolean;
  is_viewed: boolean;
}

/**
 * Gruppo di storie per profilo
 */
export interface ProfileStoryGroup {
  profile_id: number;
  username: string;
  profile_image_url: string | null;
  is_verified: boolean;
  stories: StoryWithStatus[];
  is_own_profile: boolean;
  has_unviewed_stories: boolean;
}

/**
 * Visualizzatore di una storia
 */
export interface StoryViewer {
  id: number;
  username: string;
  profile_image_url: string | null;
  viewed_at: string;
}

/**
 * Dati per creare una nuova storia
 */
export interface CreateStoryData {
  profile_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds?: number;
}

// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per la gestione delle storie.
 * Implementa il pattern Repository per centralizzare l'accesso ai dati.
 */
class StoryRepository {
  
  /**
   * Recupera tutte le storie attive visibili per l'utente corrente.
   * Include: storie proprie + storie di profili seguiti + storie di profili pubblici.
   * 
   * Le storie sono ordinate per:
   * 1. Storie proprie prima
   * 2. Storie non visualizzate
   * 3. Data di creazione (più recenti prima)
   * 
   * @param currentProfileId - ID del profilo che sta richiedendo le storie
   * @returns Array di storie raggruppate per profilo
   */
  async getActiveStoriesGrouped(currentProfileId: number): Promise<ProfileStoryGroup[]> {
    // Query per ottenere tutte le storie attive visibili
    const stories = await queryAll<{
      id: number;
      profile_id: number;
      media_url: string;
      media_type: 'image' | 'video';
      duration_seconds: number | null;
      views_count: number;
      created_at: string;
      expires_at: string;
      username: string;
      profile_image_url: string | null;
      is_verified: number;
      is_liked_by_me: number;
      is_viewed: number;
    }>(
      `SELECT 
        s.id,
        s.profile_id,
        s.media_url,
        s.media_type,
        s.duration_seconds,
        s.views_count,
        s.created_at,
        s.expires_at,
        p.username,
        p.profile_image_url,
        p.is_verified,
        -- Subquery: l'utente corrente ha messo like?
        (SELECT 1 FROM likes
         WHERE likeable_type = 'story' 
         AND likeable_id = s.id 
         AND profile_id = ?
         AND deleted_at IS NULL) as is_liked_by_me,
        -- Subquery: l'utente corrente ha visualizzato?
        (SELECT 1 FROM story_views
         WHERE story_id = s.id 
         AND viewer_profile_id = ?) as is_viewed
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
        AND p.deleted_at IS NULL
        AND (
          -- Storie proprie
          s.profile_id = ?
          -- Storie di profili seguiti
          OR s.profile_id IN (
            SELECT following_profile_id FROM follows
            WHERE follower_profile_id = ?
              AND status = 'accepted'
              AND deleted_at IS NULL
          )
          -- Storie di profili pubblici (escluse proprie)
          OR (p.is_private = 0 AND s.profile_id != ?)
        )
      ORDER BY 
        -- Proprie storie prima
        CASE WHEN s.profile_id = ? THEN 0 ELSE 1 END,
        -- Poi storie non visualizzate
        CASE WHEN (SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_profile_id = ?) THEN 1 ELSE 0 END,
        -- Infine per data di creazione
        s.created_at DESC`,
      [
        currentProfileId, // is_liked_by_me
        currentProfileId, // is_viewed
        currentProfileId, // storie proprie
        currentProfileId, // profili seguiti
        currentProfileId, // escludi proprie da pubblici
        currentProfileId, // ordina proprie prima
        currentProfileId  // ordina non visualizzate
      ]
    );

    // Raggruppa le storie per profilo
    const profileMap = new Map<number, ProfileStoryGroup>();

    for (const story of stories) {
      const isOwnProfile = story.profile_id === currentProfileId;
      
      if (!profileMap.has(story.profile_id)) {
        profileMap.set(story.profile_id, {
          profile_id: story.profile_id,
          username: story.username,
          profile_image_url: story.profile_image_url,
          is_verified: Boolean(story.is_verified),
          stories: [],
          is_own_profile: isOwnProfile,
          has_unviewed_stories: false,
        });
      }

      const group = profileMap.get(story.profile_id)!;
      const isViewed = Boolean(story.is_viewed);

      group.stories.push({
        id: story.id,
        profile_id: story.profile_id,
        media_url: story.media_url,
        media_type: story.media_type,
        duration_seconds: story.duration_seconds,
        views_count: story.views_count,
        created_at: story.created_at,
        expires_at: story.expires_at,
        deleted_at: null,
        username: story.username,
        profile_image_url: story.profile_image_url,
        is_verified: Boolean(story.is_verified),
        is_liked_by_me: Boolean(story.is_liked_by_me),
        is_viewed: isViewed,
      });

      // Aggiorna flag se c'è almeno una storia non visualizzata
      if (!isViewed) {
        group.has_unviewed_stories = true;
      }
    }

    // Converti la map in array mantenendo l'ordine
    return Array.from(profileMap.values());
  }

  /**
   * Recupera una storia specifica verificando l'accesso.
   * L'utente può accedere se:
   * - È la propria storia
   * - Segue l'autore (follow accettato)
   * - L'autore ha profilo pubblico
   * 
   * @param storyId - ID della storia
   * @param currentProfileId - ID del profilo che richiede
   * @returns Storia se accessibile, null altrimenti
   */
  async findAccessibleById(storyId: number, currentProfileId: number): Promise<Story | null> {
    const story = await queryOne<Story>(
      `SELECT s.id, s.profile_id, s.media_url, s.media_type, 
              s.duration_seconds, s.views_count, s.created_at, s.expires_at, s.deleted_at
       FROM stories s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.id = ? 
         AND s.deleted_at IS NULL
         AND s.expires_at > datetime('now')
         AND (
           -- È la propria storia
           s.profile_id = ?
           -- Segue l'autore
           OR s.profile_id IN (
             SELECT following_profile_id FROM follows 
             WHERE follower_profile_id = ? 
               AND deleted_at IS NULL 
               AND status = 'accepted'
           )
           -- Profilo pubblico
           OR (p.is_private = 0 AND s.profile_id != ?)
         )`,
      [storyId, currentProfileId, currentProfileId, currentProfileId]
    );
    return story ?? null;
  }

  /**
   * Verifica se una storia esiste ed è attiva (non scaduta).
   * 
   * @param storyId - ID della storia
   * @returns true se la storia esiste e non è scaduta
   */
  async existsAndActive(storyId: number): Promise<boolean> {
    const story = await queryOne<{ id: number }>(
      `SELECT id FROM stories 
       WHERE id = ? 
         AND deleted_at IS NULL 
         AND expires_at > datetime('now')`,
      [storyId]
    );
    return story !== null;
  }

  /**
   * Verifica se l'utente è il proprietario della storia.
   * 
   * @param storyId - ID della storia
   * @param profileId - ID del profilo da verificare
   * @returns true se il profilo è il proprietario
   */
  async isOwner(storyId: number, profileId: number): Promise<boolean> {
    const story = await queryOne<{ id: number }>(
      `SELECT id FROM stories WHERE id = ? AND profile_id = ?`,
      [storyId, profileId]
    );
    return story !== null;
  }

  /**
   * Registra la visualizzazione di una storia.
   * Idempotente: se già visualizzata, non crea duplicati.
   * 
   * @param storyId - ID della storia
   * @param viewerProfileId - ID del profilo che visualizza
   * @returns true se è stata registrata una nuova view, false se già esisteva
   */
  async recordView(storyId: number, viewerProfileId: number): Promise<boolean> {
    // Verifica se già visualizzata
    const existingView = await queryOne<{ id: number }>(
      `SELECT id FROM story_views 
       WHERE story_id = ? AND viewer_profile_id = ?`,
      [storyId, viewerProfileId]
    );

    if (existingView) {
      return false; // Già visualizzata
    }

    // Registra la visualizzazione
    await execute(
      `INSERT INTO story_views (story_id, viewer_profile_id, viewed_at)
       VALUES (?, ?, datetime('now'))`,
      [storyId, viewerProfileId]
    );

    // Incrementa contatore visualizzazioni
    await execute(
      `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
      [storyId]
    );

    return true;
  }

  /**
   * Mette like a una storia.
   * Se già liked (anche se soft-deleted), riattiva il like.
   * 
   * @param storyId - ID della storia
   * @param profileId - ID del profilo che mette like
   * @returns true se ha messo like, false se è stato rimosso (toggle)
   */
  async likeStory(storyId: number, profileId: number): Promise<boolean> {
    // Verifica like esistente
    const existingLike = await queryOne<{ id: number; deleted_at: string | null }>(
      `SELECT id, deleted_at FROM likes 
       WHERE profile_id = ? AND likeable_type = 'story' AND likeable_id = ?`,
      [profileId, storyId]
    );

    if (existingLike) {
      if (existingLike.deleted_at) {
        // Riattiva il like
        await execute(
          `UPDATE likes SET deleted_at = NULL WHERE id = ?`,
          [existingLike.id]
        );
        return true;
      } else {
        // Soft delete (toggle off)
        await execute(
          `UPDATE likes SET deleted_at = datetime('now') WHERE id = ?`,
          [existingLike.id]
        );
        return false;
      }
    } else {
      // Crea nuovo like
      await execute(
        `INSERT INTO likes (profile_id, likeable_type, likeable_id) VALUES (?, 'story', ?)`,
        [profileId, storyId]
      );
      return true;
    }
  }

  /**
   * Verifica se un utente ha messo like a una storia.
   * 
   * @param storyId - ID della storia
   * @param profileId - ID del profilo da verificare
   * @returns true se ha messo like (e non è soft-deleted)
   */
  async hasLiked(storyId: number, profileId: number): Promise<boolean> {
    const like = await queryOne<{ id: number }>(
      `SELECT id FROM likes 
       WHERE profile_id = ? 
         AND likeable_type = 'story' 
         AND likeable_id = ?
         AND deleted_at IS NULL`,
      [profileId, storyId]
    );
    return like !== null;
  }

  /**
   * Recupera la lista di chi ha visualizzato una storia.
   * Solo il proprietario può vedere questa lista.
   * 
   * @param storyId - ID della storia
   * @returns Array di visualizzatori con timestamp
   */
  async getViewers(storyId: number): Promise<StoryViewer[]> {
    return queryAll<StoryViewer>(
      `SELECT 
        p.id,
        p.username,
        p.profile_image_url,
        sv.viewed_at
       FROM story_views sv
       JOIN profiles p ON p.id = sv.viewer_profile_id
       WHERE sv.story_id = ?
       ORDER BY sv.viewed_at DESC`,
      [storyId]
    );
  }

  /**
   * Recupera le storie pubbliche di un profilo.
   * Usato per visualizzare storie senza autenticazione.
   * 
   * @param profileId - ID del profilo
   * @returns Array di storie pubbliche
   */
  async getPublicStoriesByProfile(profileId: number): Promise<StoryWithProfile[]> {
    return queryAll<{
      id: number;
      profile_id: number;
      username: string;
      profile_image_url: string | null;
      is_verified: number;
      media_url: string;
      media_type: 'image' | 'video';
      duration_seconds: number | null;
      views_count: number;
      created_at: string;
      expires_at: string;
    }>(
      `SELECT
        s.id,
        s.profile_id,
        p.username,
        p.profile_image_url,
        p.is_verified,
        s.media_url,
        s.media_type,
        s.duration_seconds,
        s.views_count,
        s.created_at,
        s.expires_at
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.profile_id = ?
        AND s.deleted_at IS NULL
        AND s.expires_at > datetime('now')
        AND p.is_private = 0
      ORDER BY s.created_at ASC`,
      [profileId]
    ).then(rows => rows.map(r => ({
      ...r,
      deleted_at: null,
      is_verified: Boolean(r.is_verified),
    })));
  }

  /**
   * Crea una nuova storia.
   * 
   * @param data - Dati della storia da creare
   * @returns ID della storia creata
   */
  async create(data: CreateStoryData): Promise<number> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await execute(
      `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.profile_id,
        data.media_url,
        data.media_type,
        data.duration_seconds || null,
        expiresAt,
      ]
    );

    return result.lastID!;
  }

  /**
   * Elimina (soft delete) una storia.
   * Solo il proprietario può eliminare.
   * 
   * @param storyId - ID della storia
   * @param profileId - ID del profilo che richiede l'eliminazione
   * @returns true se eliminata, false se non trovata o non autorizzato
   */
  async delete(storyId: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE stories 
       SET deleted_at = datetime('now')
       WHERE id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [storyId, profileId]
    );
    return result.changes > 0;
  }

  /**
   * Conta le storie attive di un profilo.
   * 
   * @param profileId - ID del profilo
   * @returns Numero di storie attive
   */
  async countActiveByProfile(profileId: number): Promise<number> {
    const result = await queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM stories 
       WHERE profile_id = ? 
         AND deleted_at IS NULL 
         AND expires_at > datetime('now')`,
      [profileId]
    );
    return result?.count || 0;
  }
}

// Singleton instance
export const storyRepository = new StoryRepository();
