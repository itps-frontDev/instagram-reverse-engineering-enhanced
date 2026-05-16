/**
 * @fileoverview Story Repository (Repository Pattern)
 *
 * Gestisce tutte le operazioni database relative alle storie.
 * Le storie scadono dopo 24 ore (expires_at = created_at + 24h).
 *
 * STRUTTURA DATABASE:
 * - stories: media, scadenza, contatore visualizzazioni
 * - story_views: chi ha visto una storia (no deleted_at, no id)
 * - story_likes: like alle storie (no deleted_at)
 *
 * DIFFERENZE RISPETTO AI POST:
 * - story_views: niente `id` e niente `viewed_at` → si usa `created_at`
 * - story_likes: niente `deleted_at` → il toggle usa SELECT + DELETE o INSERT
 * - Scadenza: filtro `expires_at > NOW()` su tutte le query che mostrano storie attive
 *
 * @module repositories/StoryRepository
 *
 * @example
 * import { storyRepository } from '@/repositories';
 *
 * // Crea una storia
 * const storyId = await storyRepository.create({ profile_id: 1, media_url: '...', media_type: 'image' });
 *
 * // Registra una visualizzazione
 * await storyRepository.recordView(storyId, viewerProfileId);
 *
 */

import { queryOne, queryAll, execute } from '@/lib/db';

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

export interface StoryWithProfile extends Story {
  username: string;
  profile_image_url: string | null;
  is_verified: boolean;
  is_liked_by_me?: boolean;
  is_viewed?: boolean;
}

export interface StoryWithStatus extends StoryWithProfile {
  is_liked_by_me: boolean;
  is_viewed: boolean;
}

export interface ProfileStoryGroup {
  profile_id: number;
  username: string;
  profile_image_url: string | null;
  is_verified: boolean;
  stories: StoryWithStatus[];
  is_own_profile: boolean;
  has_unviewed_stories: boolean;
}

export interface StoryViewer {
  id: number;
  username: string;
  profile_image_url: string | null;
  viewed_at: string;
}

export interface CreateStoryData {
  profile_id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds?: number;
}

// ============================================================================
// REPOSITORY
// ============================================================================

class StoryRepository {

  /**
   * Ottiene le storie attive raggruppate per profilo.
   * Restituisce le storie del profilo corrente + dei following + profili pubblici.
   *
   * ORDINAMENTO:
   * 1. Storie proprie per prime (CASE WHEN profile_id = currentProfileId THEN 0)
   * 2. Storie non viste prima delle viste
   * 3. Più recenti per prime (created_at DESC)
   *
   * @param currentProfileId - ID del profilo corrente
   * @returns Array di gruppi storie per profilo
   */
  async getActiveStoriesGrouped(currentProfileId: number): Promise<ProfileStoryGroup[]> {
    const stories = await queryAll<{
      id: number; profile_id: number; media_url: string; media_type: 'image' | 'video';
      duration_seconds: number | null; views_count: number; created_at: string; expires_at: string;
      username: string; profile_image_url: string | null; is_verified: boolean;
      is_liked_by_me: boolean; is_viewed: boolean;
    }>(
      `SELECT
        s.id, s.profile_id, s.media_url, s.media_type, s.duration_seconds, s.views_count,
        s.created_at, s.expires_at,
        p.username, p.profile_image_url, p.is_verified,
        (SELECT 1 FROM likes WHERE likeable_type = 'story' AND likeable_id = s.id AND profile_id = ? AND deleted_at IS NULL) as is_liked_by_me,
        (SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_profile_id = ?) as is_viewed
      FROM stories s
      JOIN profiles p ON p.id = s.profile_id
      WHERE s.deleted_at IS NULL AND s.expires_at > NOW() AND p.deleted_at IS NULL
        AND (
          s.profile_id = ?
          OR s.profile_id IN (
            SELECT following_profile_id FROM follows
            WHERE follower_profile_id = ? AND status = 'accepted' AND deleted_at IS NULL
          )
          OR (NOT p.is_private AND s.profile_id != ?)
        )
      ORDER BY
        CASE WHEN s.profile_id = ? THEN 0 ELSE 1 END,
        CASE WHEN (SELECT 1 FROM story_views WHERE story_id = s.id AND viewer_profile_id = ?) IS NOT NULL
             THEN 1 ELSE 0 END,
        s.created_at DESC`,
      [
        currentProfileId, currentProfileId,
        currentProfileId, currentProfileId, currentProfileId,
        currentProfileId, currentProfileId
      ]
    );

    const profileMap = new Map<number, ProfileStoryGroup>();
    for (const story of stories) {
      const isOwnProfile = story.profile_id === currentProfileId;
      if (!profileMap.has(story.profile_id)) {
        profileMap.set(story.profile_id, {
          profile_id: story.profile_id, username: story.username,
          profile_image_url: story.profile_image_url,
          is_verified: Boolean(story.is_verified),
          stories: [], is_own_profile: isOwnProfile, has_unviewed_stories: false,
        });
      }
      const group = profileMap.get(story.profile_id)!;
      const isViewed = Boolean(story.is_viewed);
      group.stories.push({
        id: story.id, profile_id: story.profile_id, media_url: story.media_url,
        media_type: story.media_type, duration_seconds: story.duration_seconds,
        views_count: story.views_count, created_at: story.created_at,
        expires_at: story.expires_at, deleted_at: null,
        username: story.username, profile_image_url: story.profile_image_url,
        is_verified: Boolean(story.is_verified),
        is_liked_by_me: Boolean(story.is_liked_by_me),
        is_viewed: isViewed,
      });
      if (!isViewed) group.has_unviewed_stories = true;
    }
    return Array.from(profileMap.values());
  }

  /**
   * Trova una storia attiva accessibile al profilo corrente.
   * Controlla che la storia non sia scaduta E che il viewer abbia i permessi.
   *
   * PERMESSI:
   * - Il proprietario può sempre vedere le proprie storie
   * - I following (accepted) possono vedere le storie degli utenti seguiti
   * - I profili pubblici sono visibili a tutti
   *
   * @param storyId - ID della storia
   * @param currentProfileId - ID del profilo che richiede l'accesso
   * @returns Story o null se non accessibile/scaduta
   */
  async findAccessibleById(storyId: number, currentProfileId: number): Promise<Story | null> {
    const story = await queryOne<Story>(
      `SELECT s.id, s.profile_id, s.media_url, s.media_type,
              s.duration_seconds, s.views_count, s.created_at, s.expires_at, s.deleted_at
       FROM stories s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.id = ? AND s.deleted_at IS NULL AND s.expires_at > NOW()
         AND (
           s.profile_id = ?
           OR s.profile_id IN (
             SELECT following_profile_id FROM follows
             WHERE follower_profile_id = ? AND deleted_at IS NULL AND status = 'accepted'
           )
           OR (NOT p.is_private AND s.profile_id != ?)
         )`,
      [storyId, currentProfileId, currentProfileId, currentProfileId]
    );
    return story ?? null;
  }

  /**
   * Verifica se una storia esiste ed è ancora attiva (non scaduta).
   *
   * @param storyId - ID della storia
   * @returns true se esiste e non scaduta
   */
  async existsAndActive(storyId: number): Promise<boolean> {
    const story = await queryOne<{ id: number }>(
      `SELECT id FROM stories WHERE id = ? AND deleted_at IS NULL AND expires_at > NOW()`,
      [storyId]
    );
    return story !== null;
  }

  /**
   * Trova una storia per ID (anche scaduta, per operazioni admin/owner).
   *
   * @param storyId - ID della storia
   * @returns { id, profile_id } o null se non trovata
   */
  async findById(storyId: number): Promise<{ id: number; profile_id: number } | null> {
    const story = await queryOne<{ id: number; profile_id: number }>(
      `SELECT id, profile_id FROM stories WHERE id = ? AND deleted_at IS NULL`,
      [storyId]
    );
    return story || null;
  }

  /**
   * Verifica se un profilo è il proprietario di una storia.
   * Usato per autorizzare l'eliminazione.
   *
   * @param storyId - ID della storia
   * @param profileId - ID del profilo
   * @returns true se è il proprietario
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
   * Se la storia è già stata vista dal profilo, non fa nulla (idempotente).
   *
   * NOTA: La tabella `story_views` non ha né `id` né `viewed_at`.
   * La colonna di timestamp si chiama `created_at`.
   *
   * @param storyId - ID della storia
   * @param viewerProfileId - ID del profilo che ha visto la storia
   * @returns true se la vista è nuova, false se già registrata
   */
  async recordView(storyId: number, viewerProfileId: number): Promise<boolean> {
    const existingView = await queryOne(
      `SELECT 1 FROM story_views WHERE story_id = ? AND viewer_profile_id = ?`,
      [storyId, viewerProfileId]
    );
    if (existingView) return false;

    await execute(
      `INSERT INTO story_views (story_id, viewer_profile_id) VALUES (?, ?)`,
      [storyId, viewerProfileId]
    );
    await execute(
      `UPDATE stories SET views_count = views_count + 1 WHERE id = ?`,
      [storyId]
    );
    return true;
  }

  /**
   * Ottiene la lista dei profili che hanno visualizzato una storia.
   * Ordinata per data decrescente (più recente prima).
   *
   * NOTA: La colonna di timestamp in `story_views` si chiama `created_at`,
   * ma viene restituita come `viewed_at` per compatibilità con il frontend.
   *
   * @param storyId - ID della storia
   * @returns Array di StoryViewer con viewed_at
   */
  async getViewers(storyId: number): Promise<StoryViewer[]> {
    return queryAll<StoryViewer>(
      `SELECT p.id, p.username, p.profile_image_url, sv.created_at as viewed_at
       FROM story_views sv
       JOIN profiles p ON p.id = sv.viewer_profile_id
       WHERE sv.story_id = ?
       ORDER BY sv.created_at DESC`,
      [storyId]
    );
  }

  /**
   * Ottiene le storie attive di un profilo pubblico.
   * Usato nella pagina profilo per utenti non autenticati o esterni.
   *
   * Se viewerProfileId è null (utente non autenticato), `is_liked_by_me`
   * è sempre FALSE (nessuna subquery di like necessaria).
   *
   * @param profileId - ID del profilo di cui caricare le storie
   * @param viewerProfileId - ID del profilo viewer (null se non autenticato)
   * @returns Array di storie con profilo e flag is_liked_by_me
   */
  async getPublicStoriesByProfile(profileId: number, viewerProfileId: number | null): Promise<StoryWithProfile[]> {
    const likeSelect = viewerProfileId !== null
      ? `(SELECT 1 FROM likes WHERE likeable_type = 'story' AND likeable_id = s.id AND profile_id = ? AND deleted_at IS NULL) AS is_liked_by_me`
      : 'FALSE AS is_liked_by_me';

    const params = viewerProfileId !== null ? [viewerProfileId, profileId] : [profileId];

    return queryAll<any>(
      `SELECT s.id, s.profile_id, p.username, p.profile_image_url, p.is_verified,
        s.media_url, s.media_type, s.duration_seconds, s.views_count, s.created_at, s.expires_at,
        ${likeSelect}
       FROM stories s
       JOIN profiles p ON p.id = s.profile_id
       WHERE s.profile_id = ? AND s.deleted_at IS NULL AND s.expires_at > NOW() AND NOT p.is_private
       ORDER BY s.created_at ASC`,
      params
    ).then(rows => rows.map((r: any) => ({
      ...r, deleted_at: null,
      is_verified: Boolean(r.is_verified),
      is_liked_by_me: Boolean(r.is_liked_by_me),
    })));
  }

  /**
   * Crea una nuova storia con scadenza automatica a 24 ore.
   *
   * @param data - Dati della storia (profile_id, media_url, media_type, duration_seconds?)
   * @returns ID della storia creata
   */
  async create(data: CreateStoryData): Promise<number> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = await execute(
      `INSERT INTO stories (profile_id, media_url, media_type, duration_seconds, expires_at)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [data.profile_id, data.media_url, data.media_type, data.duration_seconds || null, expiresAt]
    );
    return result.lastID!;
  }

  /**
   * Elimina una storia (soft delete). Solo il proprietario può farlo.
   *
   * @param storyId - ID della storia
   * @param profileId - ID del profilo (verifica ownership)
   * @returns true se eliminata
   */
  async delete(storyId: number, profileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE stories SET deleted_at = NOW() WHERE id = ? AND profile_id = ? AND deleted_at IS NULL`,
      [storyId, profileId]
    );
    return result.changes > 0;
  }

  /**
   * Conta le storie attive di un profilo.
   * NOTA: PostgreSQL restituisce COUNT come bigint (stringa) — usiamo Number().
   *
   * @param profileId - ID del profilo
   * @returns Numero di storie attive
   */
  async countActiveByProfile(profileId: number): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM stories
       WHERE profile_id = ? AND deleted_at IS NULL AND expires_at > NOW()`,
      [profileId]
    );
    return Number(result?.count) || 0;
  }
}

export const storyRepository = new StoryRepository();
