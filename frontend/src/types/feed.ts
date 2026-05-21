/**
 * @fileoverview Tipi per il feed.
 *
 * Definizioni di tipo per post del feed, like, commenti e dati correlati.
 * 
 * @module types/feed
 */

// ============================================================================
// TIPI POST
// ============================================================================

/**
 * Post del feed con tutti i dettagli.
 * 
 * @interface FeedPost
 */
export interface FeedPost {
  /** ID univoco del post */
  id: number;
  /** ID del profilo autore */
  profile_id: number;
  /** Didascalia del post */
  caption: string | null;
  /** Luogo del post */
  location: string | null;
  /** Se i commenti sono disabilitati */
  is_comments_disabled: boolean;
  /** Se i like sono nascosti */
  is_likes_hidden: boolean;
  /** Numero di like */
  likes_count: number;
  /** Numero di commenti */
  comments_count: number;
  /** Data creazione */
  created_at: string;

  // Dati join dalla tabella profiles
  /** Username dell'autore */
  profile_username: string;
  /** Nome completo dell'autore */
  profile_full_name: string | null;
  /** URL immagine profilo autore */
  profile_image_url: string | null;
  /** Se l'autore è verificato */
  profile_is_verified: boolean;
  /** Se l'autore ha storie attive */
  profile_has_active_story: boolean;
  /** Se l'utente corrente ha visto le storie dell'autore */
  profile_has_viewed_story: boolean;
  /** Se l'autore ha profilo privato */
  profile_is_private: boolean;

  /** Media del post */
  media: PostMedia[];

  // Interazione utente corrente
  /** Se l'utente corrente ha messo like */
  is_liked_by_current_user: boolean;
  /** Se l'utente corrente ha salvato */
  is_saved_by_current_user: boolean;
  /** Se l'utente corrente segue l'autore */
  is_following_author: boolean;
  /** Se il post contiene almeno un tag profilo */
  has_tags?: boolean;
}

/**
 * Media di un post (immagine o video).
 * 
 * @interface PostMedia
 */
export interface PostMedia {
  /** ID del media */
  id: number;
  /** ID del post */
  post_id: number;
  /** URL del media */
  media_url: string;
  /** Tipo di media */
  media_type: 'image' | 'video';
  /** Durata in secondi (solo video) */
  duration_seconds: number | null;
  /** Posizione nel carosello */
  position: number;
}

/**
 * Reel (video post) con tutti i dettagli per il feed.
 * Simile a FeedPost ma specifico per contenuti video.
 * 
 * @interface Reel
 */
export interface Reel {
  /** ID del reel */
  id: number;
  /** ID del profilo autore */
  profile_id: number;
  /** Didascalia */
  caption: string | null;
  /** Luogo */
  location: string | null;
  /** Se i commenti sono disabilitati */
  is_comments_disabled: boolean;
  /** Se i like sono nascosti */
  is_likes_hidden: boolean;
  /** Numero di like */
  likes_count: number;
  /** Numero di commenti */
  comments_count: number;
  /** Data creazione */
  created_at: string;
  /** Username autore */
  profile_username: string;
  /** Nome completo autore */
  profile_full_name: string | null;
  /** URL immagine profilo autore */
  profile_image_url: string | null;
  /** Se l'autore è verificato */
  profile_is_verified: boolean;
  /** Se l'utente corrente ha messo like */
  is_liked_by_current_user: boolean;
  /** Se l'utente corrente ha salvato */
  is_saved_by_current_user: boolean;
  /** Media del reel */
  media: PostMedia[];
}

/**
 * Commento su un post.
 * 
 * @interface Comment
 */
export interface Comment {
  /** ID del commento */
  id: number;
  /** ID del post */
  post_id: number;
  /** ID del profilo autore */
  profile_id: number;
  /** ID commento padre (per risposte) */
  parent_id: number | null;
  /** Testo del commento */
  text: string;
  /** Numero di like */
  likes_count: number;
  /** Data creazione */
  created_at: string;

  // Dati join
  /** Username autore */
  profile_username: string;
  /** Nome completo autore */
  profile_full_name: string | null;
  /** URL immagine profilo autore */
  profile_image_url: string | null;
  /** Se l'autore è verificato */
  profile_is_verified: boolean;
  /** Se l'autore ha storie attive */
  profile_has_active_story: boolean;
  /** Se l'utente corrente ha visto le storie */
  profile_has_viewed_story: boolean;
  /** Se l'autore ha profilo privato */
  profile_is_private: boolean;

  // Interazione utente corrente
  /** Se l'utente corrente ha messo like */
  is_liked_by_current_user: boolean;
}

// ============================================================================
// TIPI RICHIESTE/RISPOSTE API
// ============================================================================

/**
 * Risposta da GET /api/feed
 */
export interface GetFeedResponse {
  posts: FeedPost[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Risposta da GET /api/reels
 */
export interface GetReelsResponse {
  reels: Reel[];
  hasMore: boolean;
  total: number;
}

/**
 * Body richiesta per POST /api/posts/like
 */
export interface LikePostRequest {
  postId: number;
}

/**
 * Risposta da POST /api/posts/like
 */
export interface LikePostResponse {
  success: boolean;
  liked: boolean;
  likes_count: number;
}

/**
 * Body richiesta per POST /api/posts/save
 */
export interface SavePostRequest {
  postId: number;
}

/**
 * Risposta da POST /api/posts/save
 */
export interface SavePostResponse {
  success: boolean;
  saved: boolean;
}

/**
 * Body richiesta per POST /api/comments
 */
export interface CreateCommentRequest {
  postId: number;
  text: string;
  parentId?: number;
}

/**
 * Risposta da POST /api/comments
 */
export interface CreateCommentResponse {
  success: boolean;
  comment: Comment;
}

/**
 * Parametri per GET /api/comments
 */
export interface GetCommentsRequest {
  postId: number;
  limit?: number;
  offset?: number;
}

/**
 * Risposta da GET /api/comments
 */
export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}
