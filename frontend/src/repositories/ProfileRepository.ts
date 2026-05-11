/**
 * @fileoverview Profile Repository (Repository Pattern)
 * 
 * Gestisce tutte le operazioni database relative ai profili utente.
 * Include anche la gestione del sistema di follow (follower/following).
 * 
 * STRUTTURA DATABASE:
 * - profiles: dati del profilo (username, bio, contatori)
 * - follows: relazioni follower-following con stato (pending/accepted)
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
 * // Ottieni lista follower
 * const followers = await profileRepository.getFollowers(profileId);
 * 
 * // Crea relazione follow
 * await profileRepository.createFollow(myProfileId, targetProfileId, 'pending');
 */

import { queryOne, queryAll, execute } from '@/lib/db';
import type { Profile, FollowRelationship } from '@/types/profile';

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

/**
 * Profilo con stato di follow relativo a un visualizzatore.
 * Usato quando si visualizza il profilo di un altro utente.
 */
export interface ProfileWithFollowStatus extends Profile {
  /** Il visualizzatore segue questo profilo? */
  is_following: boolean;
  /** Questo profilo segue il visualizzatore? */
  is_followed_by: boolean;
  /** C'è una richiesta di follow in attesa? */
  is_pending: boolean;
}

/**
 * Risultato della ricerca profili.
 * Versione ridotta del profilo per i risultati di ricerca.
 */
export interface SearchResult {
  /** ID del profilo */
  id: number;
  /** Username univoco */
  username: string;
  /** Nome completo (può essere null) */
  full_name: string | null;
  /** URL immagine profilo (può essere null) */
  profile_image_url: string | null;
  /** Profilo verificato? */
  is_verified: boolean;
  /** Profilo privato? */
  is_private: boolean;
  /** Numero di follower */
  followers_count: number;
  /** L'utente corrente segue questo profilo? */
  is_following: boolean;
}

/**
 * Row raw del database per SearchResult (valori numerici prima della conversione).
 * @internal
 */
interface SearchResultRow {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: number;
  is_private: number;
  followers_count: number;
  is_following: number | null;
}

/**
 * Profilo follower/following con stato di relazione.
 * Usato nelle liste follower/following per mostrare pulsanti di azione.
 */
export interface FollowerWithStatus {
  /** ID del profilo */
  id: number;
  /** Username univoco */
  username: string;
  /** Nome completo */
  full_name: string | null;
  /** URL immagine profilo */
  profile_image_url: string | null;
  /** Profilo verificato? */
  is_verified: boolean;
  /** L'utente corrente segue questo profilo? */
  is_following: boolean;
  /** Questo profilo segue l'utente corrente? */
  follows_you: boolean;
}

/**
 * Row raw del database per FollowerWithStatus (valori numerici prima della conversione).
 * @internal
 */
interface FollowerWithStatusRow {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: number;
  is_following: number;
  follows_you: number;
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

  /**
   * Cerca profili con informazione sullo stato di follow.
   * Versione estesa di search() per l'API di ricerca.
   * 
   * Include is_following per mostrare se l'utente corrente
   * segue già i profili trovati nei risultati di ricerca.
   * 
   * STRATEGIA DI ORDINAMENTO (priorità rilevanza):
   * 1. Match esatto username = priorità 0
   * 2. Username inizia con query = priorità 1
   * 3. Altri match = priorità 2
   * 4. A parità, ordina per follower_count DESC (più popolari prima)
   * 
   * @param query - Testo da cercare
   * @param currentProfileId - ID del profilo corrente (per calcolare is_following), null se non autenticato
   * @param limit - Numero massimo risultati (default: 20)
   * @returns Array di profili con flag is_following
   */
  async searchWithFollowStatus(
    query: string, 
    currentProfileId: number | null, 
    limit = 20
  ): Promise<SearchResult[]> {
    const searchTerm = `%${query.trim().toLowerCase()}%`;
    const queryTrimmed = query.trim();
    const startsWithPattern = `${queryTrimmed.toLowerCase()}%`;

    // Costruisce la subquery per is_following solo se l'utente è autenticato
    const isFollowingSelect = currentProfileId
      ? `(SELECT 1 FROM follows 
         WHERE follower_profile_id = ? 
         AND following_profile_id = profiles.id 
         AND status = 'accepted' 
         AND deleted_at IS NULL) as is_following`
      : 'NULL as is_following';

    // Costruisce la condizione per escludere l'utente corrente dai risultati
    const excludeCurrentUser = currentProfileId ? 'AND id != ?' : '';

    const sql = `
      SELECT
        id, username, full_name, profile_image_url,
        is_verified, is_private, followers_count,
        ${isFollowingSelect}
      FROM profiles
      WHERE deleted_at IS NULL
        AND (LOWER(username) LIKE ? OR LOWER(full_name) LIKE ?)
        ${excludeCurrentUser}
      ORDER BY 
        CASE 
          WHEN LOWER(username) = LOWER(?) THEN 0
          WHEN LOWER(username) LIKE ? THEN 1
          ELSE 2
        END,
        followers_count DESC
      LIMIT ?`;

    // Parametri variano in base a se l'utente è autenticato
    const params = currentProfileId
      ? [currentProfileId, searchTerm, searchTerm, currentProfileId, queryTrimmed, startsWithPattern, limit]
      : [searchTerm, searchTerm, queryTrimmed, startsWithPattern, limit];

    // Usa il tipo Row interno per i risultati raw del database
    const results = await queryAll<SearchResultRow>(sql, params);

    // Converte i valori in booleani JavaScript
    return results.map(r => ({
      ...r,
      is_verified: Boolean(r.is_verified),
      is_private: Boolean(r.is_private),
      is_following: Boolean(r.is_following),
    }));
  },

  // ============================================================================
  // OPERAZIONI FOLLOW (Sistema Follower/Following)
  // ============================================================================

  /**
   * Ottiene la relazione di follow tra due profili.
   * Restituisce i dettagli della relazione se esiste.
   * 
   * STATI POSSIBILI:
   * - null: nessuna relazione esistente
   * - status='pending': richiesta in attesa (profilo privato)
   * - status='accepted': follow attivo
   * - status='rejected': richiesta rifiutata
   * 
   * @param followerProfileId - ID di chi segue
   * @param followingProfileId - ID di chi viene seguito
   * @returns Relazione di follow o null
   */
  async getFollowRelationship(
    followerProfileId: number,
    followingProfileId: number
  ): Promise<FollowRelationship | null> {
    const follow = await queryOne<FollowRelationship>(
      `SELECT id, follower_profile_id, following_profile_id, status, created_at
       FROM follows
       WHERE follower_profile_id = ? AND following_profile_id = ? AND deleted_at IS NULL`,
      [followerProfileId, followingProfileId]
    );
    return follow || null;
  },

  /**
   * Verifica se il profilo A segue il profilo B.
   * Considera solo i follow 'accepted' (non le richieste pending).
   * 
   * @param followerProfileId - ID di chi potrebbe seguire
   * @param followingProfileId - ID di chi potrebbe essere seguito
   * @returns true se A segue B con stato 'accepted'
   */
  async isFollowing(followerProfileId: number, followingProfileId: number): Promise<boolean> {
    const result = await queryOne(
      `SELECT 1 FROM follows
       WHERE follower_profile_id = ? AND following_profile_id = ?
         AND status = 'accepted' AND deleted_at IS NULL`,
      [followerProfileId, followingProfileId]
    );
    return !!result;
  },

  /**
   * Crea una relazione di follow.
   * 
   * LOGICA FOLLOW:
   * - Profilo pubblico: status = 'accepted' immediatamente
   * - Profilo privato: status = 'pending' (richiede approvazione)
   * 
   * Dopo la creazione, ricordarsi di aggiornare i contatori!
   * 
   * @param followerProfileId - ID di chi inizia a seguire
   * @param followingProfileId - ID di chi viene seguito
   * @param status - 'pending' o 'accepted'
   * @returns ID della nuova relazione di follow
   */
  async createFollow(
    followerProfileId: number,
    followingProfileId: number,
    status: 'pending' | 'accepted' = 'accepted'
  ): Promise<number> {
    const result = await execute(
      `INSERT INTO follows (follower_profile_id, following_profile_id, status)
       VALUES (?, ?, ?) RETURNING id`,
      [followerProfileId, followingProfileId, status]
    );
    return result.lastID;
  },

  /**
   * Aggiorna lo stato di una relazione di follow.
   * Usato per accettare o rifiutare richieste pending.
   * 
   * @param followerProfileId - ID di chi ha fatto la richiesta
   * @param followingProfileId - ID del profilo che approva/rifiuta
   * @param status - Nuovo stato: 'pending', 'accepted', o 'rejected'
   * @returns true se l'update ha avuto effetto
   */
  async updateFollowStatus(
    followerProfileId: number,
    followingProfileId: number,
    status: 'pending' | 'accepted' | 'rejected'
  ): Promise<boolean> {
    const result = await execute(
      `UPDATE follows SET status = ?, updated_at = NOW()
       WHERE follower_profile_id = ? AND following_profile_id = ? AND deleted_at IS NULL`,
      [status, followerProfileId, followingProfileId]
    );
    return result.changes > 0;
  },

  /**
   * Elimina una relazione di follow (soft delete).
   * Usato quando un utente smette di seguire qualcuno.
   * Ricordarsi di decrementare i contatori dopo!
   * 
   * @param followerProfileId - ID di chi smette di seguire
   * @param followingProfileId - ID di chi perde un follower
   * @returns true se la relazione è stata eliminata
   */
  async deleteFollow(followerProfileId: number, followingProfileId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE follows SET deleted_at = NOW()
       WHERE follower_profile_id = ? AND following_profile_id = ? AND deleted_at IS NULL`,
      [followerProfileId, followingProfileId]
    );
    return result.changes > 0;
  },

  /**
   * Ottiene la lista dei follower di un profilo con stato di follow.
   * Include se l'utente corrente segue ogni follower e viceversa.
   * 
   * Usato nelle API followers/following per mostrare
   * pulsanti "Segui già" / "Ti segue" nella lista.
   * 
   * @param profileId - ID del profilo di cui ottenere i follower
   * @param currentProfileId - ID dell'utente corrente (può essere null)
   * @param limit - Numero massimo di risultati (default: 50)
   * @param offset - Offset per paginazione (default: 0)
   * @returns Array di profili con is_following e follows_you
   */
  async getFollowersWithStatus(
    profileId: number, 
    currentProfileId: number | null,
    limit = 50, 
    offset = 0
  ): Promise<FollowerWithStatus[]> {
    const viewerId = currentProfileId || 0;
    
    // Usa il tipo Row interno per i risultati raw del database
    const profiles = await queryAll<FollowerWithStatusRow>(
      `SELECT
        p.id, p.username, p.full_name, p.profile_image_url, p.is_verified,
        -- L'utente corrente segue questo follower
        EXISTS(
          SELECT 1 FROM follows f2
          WHERE f2.follower_profile_id = ?
          AND f2.following_profile_id = p.id
          AND f2.status = 'accepted'
          AND f2.deleted_at IS NULL
        ) as is_following,
        -- Questo follower segue l'utente corrente
        EXISTS(
          SELECT 1 FROM follows f3
          WHERE f3.follower_profile_id = p.id
          AND f3.following_profile_id = ?
          AND f3.status = 'accepted'
          AND f3.deleted_at IS NULL
        ) as follows_you
       FROM profiles p
       INNER JOIN follows f ON f.follower_profile_id = p.id
       WHERE f.following_profile_id = ? 
         AND f.status = 'accepted' 
         AND f.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [viewerId, viewerId, profileId, limit, offset]
    );
    
    // Converte i valori in booleani JavaScript
    return profiles.map(p => ({
      ...p,
      is_verified: Boolean(p.is_verified),
      is_following: Boolean(p.is_following),
      follows_you: Boolean(p.follows_you),
    }));
  },

  /**
   * Ottiene la lista dei following di un profilo con stato di follow.
   * Include se l'utente corrente segue ogni followed e viceversa.
   * 
   * @param profileId - ID del profilo di cui ottenere i following
   * @param currentProfileId - ID dell'utente corrente (può essere null)
   * @param limit - Numero massimo di risultati (default: 50)
   * @param offset - Offset per paginazione (default: 0)
   * @returns Array di profili con is_following e follows_you
   */
  async getFollowingWithStatus(
    profileId: number, 
    currentProfileId: number | null,
    limit = 50, 
    offset = 0
  ): Promise<FollowerWithStatus[]> {
    const viewerId = currentProfileId || 0;
    
    // Usa il tipo Row interno per i risultati raw del database
    const profiles = await queryAll<FollowerWithStatusRow>(
      `SELECT
        p.id, p.username, p.full_name, p.profile_image_url, p.is_verified,
        -- L'utente corrente segue questo profilo
        EXISTS(
          SELECT 1 FROM follows f2
          WHERE f2.follower_profile_id = ?
          AND f2.following_profile_id = p.id
          AND f2.status = 'accepted'
          AND f2.deleted_at IS NULL
        ) as is_following,
        -- Questo profilo segue l'utente corrente
        EXISTS(
          SELECT 1 FROM follows f3
          WHERE f3.follower_profile_id = p.id
          AND f3.following_profile_id = ?
          AND f3.status = 'accepted'
          AND f3.deleted_at IS NULL
        ) as follows_you
       FROM profiles p
       INNER JOIN follows f ON f.following_profile_id = p.id
       WHERE f.follower_profile_id = ? 
         AND f.status = 'accepted' 
         AND f.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [viewerId, viewerId, profileId, limit, offset]
    );
    
    // Converte i valori in booleani JavaScript
    return profiles.map(p => ({
      ...p,
      is_verified: Boolean(p.is_verified),
      is_following: Boolean(p.is_following),
      follows_you: Boolean(p.follows_you),
    }));
  },

  /**
   * Ottiene la lista dei follower di un profilo.
   * Usa INNER JOIN per collegare follows e profiles.
   * 
   * INNER JOIN vs LEFT JOIN:
   * - INNER: restituisce solo righe con match in entrambe le tabelle
   * - LEFT: restituisce tutte le righe della tabella sinistra
   * 
   * Qui usiamo INNER perché vogliamo solo profili che esistono.
   * Supporta paginazione con LIMIT e OFFSET.
   * 
   * @param profileId - ID del profilo di cui ottenere i follower
   * @param limit - Numero massimo di risultati (default: 50)
   * @param offset - Offset per paginazione (default: 0)
   * @returns Array di profili che seguono l'utente
   */
  async getFollowers(profileId: number, limit = 50, offset = 0): Promise<Profile[]> {
    const profiles = await queryAll<Profile>(
      `SELECT
        p.id, p.user_id, p.username, p.full_name, p.profile_image_url,
        p.bio, p.is_private, p.is_verified, p.followers_count, p.following_count
       FROM profiles p
       INNER JOIN follows f ON f.follower_profile_id = p.id
       WHERE f.following_profile_id = ? AND f.status = 'accepted' AND f.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
    
    return profiles.map(p => ({
      ...p,
      is_private: Boolean(p.is_private),
      is_verified: Boolean(p.is_verified),
    }));
  },

  /**
   * Ottiene la lista dei profili seguiti da un utente.
   * Inverso di getFollowers: qui cerchiamo chi l'utente segue.
   * 
   * @param profileId - ID del profilo di cui ottenere i following
   * @param limit - Numero massimo di risultati (default: 50)
   * @param offset - Offset per paginazione (default: 0)
   * @returns Array di profili che l'utente segue
   */
  async getFollowing(profileId: number, limit = 50, offset = 0): Promise<Profile[]> {
    const profiles = await queryAll<Profile>(
      `SELECT
        p.id, p.user_id, p.username, p.full_name, p.profile_image_url,
        p.bio, p.is_private, p.is_verified, p.followers_count, p.following_count
       FROM profiles p
       INNER JOIN follows f ON f.following_profile_id = p.id
       WHERE f.follower_profile_id = ? AND f.status = 'accepted' AND f.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [profileId, limit, offset]
    );
    
    return profiles.map(p => ({
      ...p,
      is_private: Boolean(p.is_private),
      is_verified: Boolean(p.is_verified),
    }));
  },

  /**
   * Ottiene le richieste di follow in attesa per un profilo privato.
   * Mostra chi vuole seguire l'utente ma non è ancora stato approvato.
   * 
   * @param profileId - ID del profilo che ha le richieste pending
   * @param limit - Numero massimo di risultati (default: 50)
   * @returns Array di profili che hanno richiesto di seguire
   */
  async getPendingFollowRequests(profileId: number, limit = 50): Promise<Profile[]> {
    const profiles = await queryAll<Profile>(
      `SELECT
        p.id, p.user_id, p.username, p.full_name, p.profile_image_url,
        p.bio, p.is_private, p.is_verified
       FROM profiles p
       INNER JOIN follows f ON f.follower_profile_id = p.id
       WHERE f.following_profile_id = ? AND f.status = 'pending' AND f.deleted_at IS NULL
         AND p.deleted_at IS NULL
       ORDER BY f.created_at DESC
       LIMIT ?`,
      [profileId, limit]
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
   * Incrementa il contatore follower di un profilo.
   * Chiamare quando qualcuno inizia a seguire il profilo.
   * 
   * @param profileId - ID del profilo che guadagna follower
   * @param amount - Numero di follower da aggiungere (default: 1)
   */
  async incrementFollowersCount(profileId: number, amount = 1): Promise<void> {
    await execute(
      `UPDATE profiles SET followers_count = followers_count + ?, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [amount, profileId]
    );
  },

  /**
   * Decrementa il contatore follower di un profilo.
   * Chiamare quando qualcuno smette di seguire il profilo.
   * Usa GREATEST(0, ...) per evitare valori negativi.
   * 
   * @param profileId - ID del profilo che perde un follower
   */
  async decrementFollowersCount(profileId: number): Promise<void> {
    await execute(
      `UPDATE profiles SET followers_count = GREATEST(0, followers_count - 1), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [profileId]
    );
  },

  /**
   * Incrementa il contatore following di un profilo.
   * Chiamare quando l'utente inizia a seguire qualcuno.
   * 
   * @param profileId - ID del profilo che inizia a seguire
   */
  async incrementFollowingCount(profileId: number): Promise<void> {
    await execute(
      `UPDATE profiles SET following_count = following_count + 1, updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [profileId]
    );
  },

  /**
   * Decrementa il contatore following di un profilo.
   * Chiamare quando l'utente smette di seguire qualcuno.
   * 
   * @param profileId - ID del profilo che smette di seguire
   */
  async decrementFollowingCount(profileId: number): Promise<void> {
    await execute(
      `UPDATE profiles SET following_count = GREATEST(0, following_count - 1), updated_at = NOW()
       WHERE id = ? AND deleted_at IS NULL`,
      [profileId]
    );
  },

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

  /**
   * Ottiene suggerimenti di profili da seguire.
   * Restituisce profili pubblici che l'utente non sta già seguendo.
   * 
   * CRITERI DI SELEZIONE:
   * - Solo profili pubblici
   * - Non già seguiti dall'utente corrente
   * - Non l'utente stesso
   * - Ordinati per popolarità (followers_count)
   * 
   * @param currentProfileId - ID del profilo corrente
   * @param limit - Numero massimo di suggerimenti (default: 5)
   * @returns Array di profili suggeriti con info follow
   */
  async getSuggestions(
    currentProfileId: number,
    limit = 5
  ): Promise<{
    id: number;
    username: string;
    full_name: string | null;
    profile_image_url: string | null;
    is_verified: boolean;
    followers_count: number;
    is_following: boolean;
    isPending: boolean;
  }[]> {
    const results = await queryAll<{
      id: number;
      username: string;
      full_name: string | null;
      profile_image_url: string | null;
      is_verified: number;
      followers_count: number;
      is_following: number;
      follow_status: string | null;
    }>(
      `SELECT
        p.id,
        p.username,
        p.full_name,
        p.profile_image_url,
        p.is_verified,
        p.followers_count,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_profile_id = ?
              AND f.following_profile_id = p.id
              AND f.status = 'accepted'
              AND f.deleted_at IS NULL
          ) THEN 1
          ELSE 0
        END as is_following,
        (
          SELECT f.status FROM follows f
          WHERE f.follower_profile_id = ?
            AND f.following_profile_id = p.id
            AND f.deleted_at IS NULL
          LIMIT 1
        ) as follow_status
      FROM profiles p
      WHERE p.id != ?
        AND NOT p.is_private
        AND p.deleted_at IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_profile_id = ?
            AND f.following_profile_id = p.id
            AND f.status = 'accepted'
            AND f.deleted_at IS NULL
        )
      ORDER BY p.followers_count DESC, p.created_at DESC
      LIMIT ?`,
      [currentProfileId, currentProfileId, currentProfileId, currentProfileId, limit]
    );

    return results.map(profile => ({
      ...profile,
      is_verified: Boolean(profile.is_verified),
      is_following: Boolean(profile.is_following),
      isPending: profile.follow_status === 'pending',
    }));
  },

  /**
   * Accetta una richiesta di follow in pending.
   * Aggiorna lo stato da 'pending' a 'accepted' usando l'ID della relazione.
   * 
   * @param followId - ID della relazione di follow
   * @returns true se l'update ha avuto effetto
   */
  async acceptFollowById(followId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE follows
       SET status = 'accepted',
           updated_at = NOW()
       WHERE id = ?`,
      [followId]
    );
    return result.changes > 0;
  },

  /**
   * Elimina (soft delete) una relazione di follow per ID.
   * 
   * @param followId - ID della relazione di follow
   * @returns true se l'eliminazione ha avuto effetto
   */
  async deleteFollowById(followId: number): Promise<boolean> {
    const result = await execute(
      `UPDATE follows
       SET deleted_at = NOW()
       WHERE id = ?`,
      [followId]
    );
    return result.changes > 0;
  },

  /**
   * Accetta tutte le richieste di follow pending verso un profilo.
   * Usato quando un profilo passa da privato a pubblico.
   * 
   * @param profileId - ID del profilo che riceve le richieste
   * @returns Numero di richieste accettate
   */
  async acceptAllPendingFollowRequests(profileId: number): Promise<number> {
    const result = await execute(
      `UPDATE follows 
       SET status = 'accepted', updated_at = NOW()
       WHERE following_profile_id = ? 
         AND status = 'pending' 
         AND deleted_at IS NULL`,
      [profileId]
    );
    return result.changes;
  },

  /**
   * Verifica se l'utente corrente può visualizzare i post di un profilo.
   * 
   * LOGICA:
   * - Profilo pubblico: chiunque può vedere
   * - Profilo privato: solo il proprietario o chi lo segue con status 'accepted'
   * 
   * @param targetProfileId - ID del profilo da visualizzare
   * @param isPrivate - Se il profilo è privato
   * @param currentProfileId - ID del profilo corrente (null se non loggato)
   * @returns true se può visualizzare, false altrimenti
   */
  async canViewPosts(
    targetProfileId: number,
    isPrivate: boolean,
    currentProfileId: number | null
  ): Promise<boolean> {
    // Profilo pubblico: chiunque può vedere
    if (!isPrivate) {
      return true;
    }

    // Non loggato: non può vedere profilo privato
    if (!currentProfileId) {
      return false;
    }

    // Proprio profilo: può sempre vedere
    if (currentProfileId === targetProfileId) {
      return true;
    }

    // Verifica se segue con status 'accepted'
    const followRelation = await this.getFollowRelationship(
      currentProfileId,
      targetProfileId
    );
    return followRelation?.status === 'accepted';
  },
};

export default profileRepository;
