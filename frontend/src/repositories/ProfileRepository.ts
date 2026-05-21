/**
 * @fileoverview Profile Repository (Repository Pattern)
 * 
 * Gestisce tutte le operazioni database relative ai profili utente.
 *
 * STRUTTURA DATABASE:
 * - profiles: dati del profilo (username, bio, contatori)
 * 
 * NOTA SUI BOOLEANI:
 * PostgreSQL restituisce i booleani nativamente, ma il driver `pg`
 * può restituirli come stringa o number in alcune query con subquery scalari.
 * Usiamo Boolean() in modo difensivo per garantire il tipo corretto.
 * 
 * @module repositories/ProfileRepository
 * 
 * @example
 * import { profileRepository } from '@/repositories';
 * 
 * // Trova profilo per username
 * const profile = await profileRepository.findByUsername('johndoe');
 * 

 */

import { queryOne, queryAll, execute } from '@/lib/db';
import type { Profile } from '@/types/profile';

// ============================================================================
// TIPI PER LE OPERAZIONI DEL REPOSITORY
// ============================================================================

/**
 * Dati necessari per creare un nuovo profilo.
 * Ogni utente deve avere un profilo per interagire con l'app.
 */
export interface CreateProfileData {
  /** ID dell'utente proprietario (foreign key verso users) */
  user_id: string | number;
  /** Username unico, usato nell'URL del profilo */
  username: string;
  /** Nome completo visualizzato */
  full_name?: string;
  /** URL dell'immagine profilo */
  profile_image_url?: string;
  /** Biografia del profilo (max 150 caratteri) */
  bio?: string;
  /** URL del sito web personale */
  website_url?: string;
  /** Se true, richiede approvazione per i follow */
  is_private?: boolean;
}

/**
 * Dati per aggiornare un profilo esistente.
 * Pattern Partial Update: solo i campi forniti vengono modificati.
 */
export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  profile_image_url?: string;
  bio?: string;
  website_url?: string;
  /** Genere: male, female, prefer_not_to_say, custom, o null */
  gender?: 'male' | 'female' | 'prefer_not_to_say' | 'custom' | null;
  /** Genere personalizzato (quando gender = 'custom') */
  custom_gender?: string;
  is_private?: boolean;
}


// ============================================================================
// REPOSITORY
// ============================================================================

/**
 * Repository per le operazioni sui profili.
 * Include metodi per CRUD profili e gestione sistema follow.
 */
export const profileRepository = {
  /**
   * Trova un profilo per ID.
   * 
   * @param id - ID del profilo
   * @returns Profilo trovato o null
   */
  async findById(id: number): Promise<Profile | null> {
    const profile = await queryOne<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified,
        followers_count, following_count, posts_count,
        created_at, updated_at
       FROM profiles
       WHERE id = ? AND deleted_at IS NULL`,
      [id]
    );
    
    if (profile) {
      profile.is_private = Boolean(profile.is_private);
      profile.is_verified = Boolean(profile.is_verified);
    }

    return profile || null;
  },

  /**
   * Trova un profilo per ID utente.
   * Utile per ottenere il profilo dell'utente autenticato.
   * 
   * @param userId - ID dell'utente (dalla tabella users)
   * @returns Profilo dell'utente o null
   */
  async findByUserId(userId: string | number): Promise<Profile | null> {
    const userIdText = String(userId).trim();
    const profile = await queryOne<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified, gender, custom_gender,
        followers_count, following_count, posts_count,
        created_at, updated_at
       FROM profiles
       WHERE user_id::text = ? AND deleted_at IS NULL`,
      [userIdText]
    );
    
    if (profile) {
      profile.is_private = Boolean(profile.is_private);
      profile.is_verified = Boolean(profile.is_verified);
    }

    return profile || null;
  },

  /**
   * Trova un profilo per username.
   * La ricerca è case-insensitive grazie al tipo CITEXT di PostgreSQL.
   * 'JohnDoe' e 'johndoe' trovano lo stesso profilo senza clausole speciali.
   *
   * @param username - Username da cercare
   * @returns Profilo trovato o null
   */
  async findByUsername(username: string): Promise<Profile | null> {
    const profile = await queryOne<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified,
        followers_count, following_count, posts_count,
        created_at, updated_at
       FROM profiles
       WHERE username = ? AND deleted_at IS NULL`,
      [username.trim().toLowerCase()]
    );
    
    if (profile) {
      profile.is_private = Boolean(profile.is_private);
      profile.is_verified = Boolean(profile.is_verified);
    }

    return profile || null;
  },

  /**
   * Crea un nuovo profilo.
   * Chiamato dopo la registrazione utente.
   * 
   * NOTA: I contatori (followers_count, following_count, posts_count)
   * vengono inizializzati a 0 automaticamente dal database (DEFAULT 0).
   * 
   * @param data - Dati del nuovo profilo
   * @returns ID del profilo appena creato
   */
  async create(data: CreateProfileData): Promise<number> {
    const result = await execute(
      `INSERT INTO profiles (user_id, username, full_name, profile_image_url, bio, website_url, is_private)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      [
        data.user_id,
        data.username.trim().toLowerCase(),
        data.full_name || null,
        data.profile_image_url || null,
        data.bio || null,
        data.website_url || null,
        data.is_private ?? false,
      ]
    );
    return result.lastID;
  },

  /**
   * Aggiorna un profilo esistente.
   * Costruisce dinamicamente la query SQL.
   * 
   * PATTERN: Query Builder Dinamica
   * Invece di UPDATE con tutti i campi, costruiamo la query
   * solo con i campi effettivamente da aggiornare.
   * Questo previene la sovrascrittura accidentale.
   * 
   * @param id - ID del profilo
   * @param data - Campi da aggiornare
   * @returns true se l'update ha modificato almeno una riga
   */
  async update(id: number, data: UpdateProfileData): Promise<boolean> {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.username !== undefined) {
      fields.push('username = ?');
      values.push(data.username.trim().toLowerCase());
    }
    if (data.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(data.full_name || null); // stringa vuota -> null
    }
    if (data.profile_image_url !== undefined) {
      fields.push('profile_image_url = ?');
      values.push(data.profile_image_url || null); // stringa vuota -> null
    }
    if (data.bio !== undefined) {
      fields.push('bio = ?');
      values.push(data.bio || null); // stringa vuota -> null
    }
    if (data.website_url !== undefined) {
      fields.push('website_url = ?');
      values.push(data.website_url || null); // stringa vuota -> null
    }
    if (data.gender !== undefined) {
      fields.push('gender = ?');
      values.push(data.gender);
    }
    if (data.custom_gender !== undefined) {
      fields.push('custom_gender = ?');
      values.push(data.custom_gender);
    }
    if (data.is_private !== undefined) {
      fields.push('is_private = ?');
      values.push(data.is_private);
    }

    if (fields.length === 0) return false;

    fields.push("updated_at = NOW()");
    values.push(id);

    const result = await execute(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`,
      values
    );
    return result.changes > 0;
  },

  /**
   * Verifica se uno username è già in uso.
   * Usato durante registrazione e modifica profilo.
   * 
   * @param username - Username da verificare
   * @param excludeProfileId - ID profilo da escludere (per modifica proprio username)
   * @returns true se lo username è già usato
   */
  async isUsernameTaken(username: string, excludeProfileId?: number): Promise<boolean> {
    const normalizedUsername = username.trim().toLowerCase();
    const query = excludeProfileId
      ? `SELECT 1 FROM profiles WHERE username = ? AND id != ? AND deleted_at IS NULL`
      : `SELECT 1 FROM profiles WHERE username = ? AND deleted_at IS NULL`;
    const params = excludeProfileId ? [normalizedUsername, excludeProfileId] : [normalizedUsername];
    const result = await queryOne(query, params);
    return !!result;
  },

  /**
   * Cerca profili per username o nome completo.
   * Usato nella barra di ricerca dell'app.
   * 
   * STRATEGIA DI RICERCA:
   * 1. Usa LIKE con % per match parziale (es. 'john' trova 'john_doe')
   * 2. Ordina prima i risultati che iniziano con la query (match esatto all'inizio)
   * 3. A parità, ordina per numero follower (profili più popolari prima)
   * 
   * CASE WHEN nella ORDER BY:
   * Assegna 0 ai profili il cui username inizia con la query, 1 agli altri.
   * Così i match migliori appaiono per primi.
   * 
   * @param query - Testo da cercare
   * @param limit - Numero massimo risultati (default: 20)
   * @param excludeProfileId - ID profilo da escludere (es. l'utente corrente)
   * @returns Array di profili che matchano la ricerca
   */
  async search(query: string, limit = 20, excludeProfileId?: number): Promise<Profile[]> {
    const searchPattern = `%${query}%`;
    const profiles = await queryAll<Profile>(
      `SELECT
        id, user_id, username, full_name, profile_image_url,
        bio, website_url, is_private, is_verified,
        followers_count, following_count, posts_count
       FROM profiles
       WHERE (username LIKE ? OR full_name LIKE ?)
         AND deleted_at IS NULL
         ${excludeProfileId ? 'AND id != ?' : ''}
       ORDER BY 
         CASE WHEN username LIKE ? THEN 0 ELSE 1 END,
         followers_count DESC
       LIMIT ?`,
      excludeProfileId 
        ? [searchPattern, searchPattern, excludeProfileId, `${query}%`, limit]
        : [searchPattern, searchPattern, `${query}%`, limit]
    );
    
    return profiles.map(p => ({
      ...p,
      is_private: Boolean(p.is_private),
      is_verified: Boolean(p.is_verified),
    }));
  },


  // ============================================================================
  // OPERAZIONI SUI CONTATORI
  // ============================================================================
  //
  // NOTA IMPORTANTE: I contatori (followers_count, following_count, posts_count)
  // sono de-normalizzati per performance. Invece di contare con COUNT(*) ogni volta,
  // manteniamo il conteggio aggiornato. Questo è un trade-off comune:
  // - PRO: Query di lettura molto più veloci
  // - CON: Possibile inconsistenza se gli update falliscono
  //
  // GREATEST(0, count - 1) previene valori negativi in caso di bug.

  /**
   * Incrementa il contatore post di un profilo.
   * Chiamare dopo la creazione di un nuovo post.
   * 
   * @param profileId - ID del profilo che ha creato un post
   */
  async incrementPostsCount(profileId: number): Promise<void> {
    await execute(
      `UPDATE profiles SET posts_count = posts_count + 1, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [profileId]
    );
  },

  /**
   * Decrementa il contatore post di un profilo.
   * Chiamare dopo l'eliminazione di un post.
   * 
   * @param profileId - ID del profilo che ha eliminato un post
   */
  async decrementPostsCount(profileId: number): Promise<void> {
    await execute(
      `UPDATE profiles SET posts_count = GREATEST(0, posts_count - 1), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [profileId]
    );
  },

  /**
   * Trova un profilo per username con campi dinamici calcolati.
   * Include informazioni su storie attive e reels.
   * 
   * CAMPI DINAMICI CALCOLATI:
   * - has_reels: il profilo ha post con video
   * - has_any_active_story: ha storie non scadute
   * - has_active_story: ha storie visibili E non viste dal viewer
   * - has_viewed_story: il viewer ha visto almeno una storia attiva
   * 
   * @param username - Username da cercare
   * @param viewerProfileId - ID del profilo che visualizza (per calcoli storie)
   * @returns Profilo con campi dinamici o null
   */
  async findByUsernameWithDetails(
    username: string, 
    viewerProfileId: number | null
  ): Promise<(Profile & {
    has_reels: boolean;
    has_any_active_story: boolean;
    has_active_story: boolean;
    has_viewed_story: boolean;
  }) | null> {
    const viewerId = Number.isFinite(viewerProfileId) ? Number(viewerProfileId) : 0;
    
    const result = await queryOne<any>(
      `SELECT
        id,
        user_id,
        username,
        full_name,
        profile_image_url,
        bio,
        website_url,
        is_private,
        is_verified,
        followers_count,
        following_count,
        posts_count,
        created_at,
        updated_at,
        -- Subquery: ha reels (post con video)
        (
          SELECT COUNT(*) > 0
          FROM posts p
          INNER JOIN post_media pm ON pm.post_id = p.id
          WHERE p.profile_id = profiles.id
            AND pm.media_type = 'video'
            AND p.deleted_at IS NULL
        ) as has_reels,
        -- Subquery: ha storie attive
        (
          SELECT COUNT(*) > 0
          FROM stories s
          WHERE s.profile_id = profiles.id
            AND s.deleted_at IS NULL
            AND s.expires_at > NOW()
        ) as has_any_active_story,
        -- Subquery: ha storie NON viste dal viewer
        (
          SELECT CASE
            WHEN COUNT(*) > 0 AND EXISTS (
              SELECT 1 FROM stories s2
              WHERE s2.profile_id = profiles.id
              AND s2.deleted_at IS NULL
              AND s2.expires_at > NOW()
              AND (
                s2.profile_id = ${viewerId} OR
                s2.profile_id IN (
                  SELECT following_profile_id FROM follows
                   WHERE follower_profile_id = ${viewerId}
                   AND status = 'accepted'
                ) OR
                NOT profiles.is_private
              )
              AND NOT EXISTS (
                SELECT 1 FROM story_views sv2
                WHERE sv2.story_id = s2.id
                AND sv2.viewer_profile_id = ${viewerId}
              )
            ) THEN 1 ELSE 0 END
          FROM stories s
          WHERE s.profile_id = profiles.id
            AND s.deleted_at IS NULL
            AND s.expires_at > NOW()
        ) as has_active_story,
        -- Subquery: il viewer ha visto almeno una storia
        (
          SELECT COUNT(*) > 0
          FROM story_views sv
          INNER JOIN stories s ON s.id = sv.story_id
          WHERE s.profile_id = profiles.id
            AND sv.viewer_profile_id = ${viewerId}
            AND s.deleted_at IS NULL
            AND s.expires_at > NOW()
        ) as has_viewed_story
      FROM profiles
      WHERE username = ? AND deleted_at IS NULL`,
      [username]
    );

    if (!result) return null;

    // Converti tutti i valori in booleani JavaScript
    return {
      id: result.id,
      user_id: result.user_id,
      username: result.username,
      full_name: result.full_name,
      profile_image_url: result.profile_image_url,
      bio: result.bio,
      website_url: result.website_url,
      is_private: Boolean(result.is_private),
      is_verified: Boolean(result.is_verified),
      followers_count: result.followers_count,
      following_count: result.following_count,
      posts_count: result.posts_count,
      created_at: result.created_at,
      updated_at: result.updated_at,
      has_reels: Boolean(result.has_reels),
      has_any_active_story: Boolean(result.has_any_active_story),
      has_active_story: Boolean(result.has_active_story),
      has_viewed_story: Boolean(result.has_viewed_story),
    };
  },

};

export default profileRepository;
