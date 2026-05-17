/**
 * @fileoverview Definizioni di tipo per funzionalità profilo Instagram.
 *
 * Contiene tutte le interfacce e i tipi TypeScript utilizzati nelle
 * pagine profilo, route API e componenti.
 * 
 * @module types/profile
 */

// ============================================================================
// TIPI PROFILO BASE
// ============================================================================

/**
 * Informazioni profilo dalla tabella profiles.
 * 
 * @interface Profile
 */
export interface Profile {
  /** ID univoco del profilo */
  id: number;
  /** ID dell'utente associato */
  user_id: string;
  /** Nome utente univoco */
  username: string;
  /** Nome completo (opzionale) */
  full_name: string | null;
  /** URL immagine profilo */
  profile_image_url: string | null;
  /** Biografia del profilo */
  bio: string | null;
  /** URL sito web */
  website_url: string | null;
  /** Se il profilo è privato */
  is_private: boolean;
  /** Se il profilo è verificato */
  is_verified: boolean;
  /** Genere: male, female, prefer_not_to_say, custom */
  gender?: string | null;
  /** Genere personalizzato quando gender = 'custom' */
  custom_gender?: string | null;
  /** Numero di follower */
  followers_count: number;
  /** Numero di profili seguiti */
  following_count: number;
  /** Numero di post */
  posts_count: number;
  /** Se il profilo ha video post (reels) */
  has_reels?: boolean;
  /** Se il profilo ha storie attive (indipendentemente dalle visualizzazioni) */
  has_any_active_story?: boolean;
  /** Se il profilo ha storie attive non ancora viste dall'utente corrente */
  has_active_story?: boolean;
  /** Se l'utente corrente ha visto le storie di questo profilo */
  has_viewed_story?: boolean;
  /** Data creazione */
  created_at?: string;
  /** Data ultimo aggiornamento */
  updated_at?: string;
}

/**
 * Informazioni post per visualizzazione griglia.
 * 
 * @interface Post
 */
export interface Post {
  /** ID univoco del post */
  id: number;
  /** Didascalia del post */
  caption: string | null;
  /** Numero di like */
  likes_count: number;
  /** Numero di commenti */
  comments_count: number;
  /** Data creazione */
  created_at: string;
  /** URL del primo media */
  media_url: string | null;
  /** Tipo di media */
  media_type: 'image' | 'video' | null;
  /** Numero totale di media nel carosello */
  media_count: number;
}

/**
 * Post semplificato per anteprima (hover card).
 * 
 * @interface PreviewPost
 */
export interface PreviewPost {
  /** ID del post */
  id: number;
  /** URL del media */
  media_url: string | null;
  /** Tipo di media */
  media_type: string | null;
}

/**
 * Relazione di follow tra due profili.
 * 
 * @interface FollowRelationship
 */
export interface FollowRelationship {
  /** ID della relazione */
  id: number;
  /** ID del profilo che segue */
  follower_profile_id: number;
  /** ID del profilo seguito */
  following_profile_id: number;
  /** Stato della richiesta */
  status: 'pending' | 'accepted' | 'rejected';
  /** Data creazione */
  created_at: string;
}

/**
 * Stato del follow per rendering UI.
 * 
 * @interface FollowStatus
 */
export interface FollowStatus {
  /** L'utente corrente segue questo profilo */
  isFollowing: boolean;
  /** Questo profilo segue l'utente corrente */
  isFollowedBy: boolean;
  /** Richiesta di follow in attesa (account privati) */
  isPending: boolean;
  /** È il profilo dell'utente corrente */
  isOwnProfile: boolean;
}

/**
 * Informazioni storie in evidenza.
 * 
 * @interface StoryHighlight
 */
export interface StoryHighlight {
  /** ID dell'highlight */
  id: number;
  /** ID del profilo proprietario */
  profile_id: number;
  /** Nome dell'highlight */
  name: string;
  /** URL immagine copertina */
  cover_image_url: string;
  /** Data creazione */
  created_at: string;
  /** Numero di storie nell'highlight */
  story_count: number;
}

// ============================================================================
// TIPI RICHIESTE/RISPOSTE API
// ============================================================================

/**
 * Risposta da GET /api/profiles/[username]
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string | null;
  message?: string | null;
}

export interface ProfileContext {
  isOwner?: boolean;
  followStatus?: 'none' | 'pending' | 'accepted';
  canView?: boolean;
}

export interface GetProfileResponse {
  // New shape: payload may contain profile and context
  profile?: Profile;
  context?: ProfileContext;
  // Back-compat top-level fields that older API clients used
  isOwner?: boolean;
  followStatus?: 'none' | 'pending' | 'accepted';
  canView?: boolean;
}

/**
 * Risposta da GET /api/profiles/[username]/preview
 */
export interface ProfilePreviewResponse {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  recent_posts: PreviewPost[];
}

/**
 * Risposta da GET /api/profiles/[username]/posts
 */
export interface GetPostsResponse {
  posts: Post[];
  hasMore: boolean;
  total?: number;
}

/**
 * Risposta da GET /api/priv/profiles/{username}/follow-status (Spring)
 * 
 * Rappresenta lo stato della relazione di follow tra utente corrente e profilo target.
 * Mappato a {@link FollowStatus} per compatibilità UI.
 */
export interface GetFollowStatusResponse {
  isFollowing: boolean;
  isFollowedBy: boolean;
  isPending: boolean;
  isOwnProfile: boolean;
}

/**
 * Risposta da GET /api/profiles/[username]/can-view
 */
export interface CanViewResponse {
  canView: boolean;
  reason?: 'private' | 'blocked' | 'not_found';
}

/**
 * Body richiesta per POST /api/profiles/actions/follow
 */
export interface FollowRequest {
  targetProfileId: number;
}

/**
 * Risposta da POST /api/profiles/actions/follow
 */
export interface FollowResponse {
  success: boolean;
  status: 'pending' | 'accepted';
  message: string;
}

/**
 * Body richiesta per POST /api/profiles/actions/unfollow
 */
export interface UnfollowRequest {
  targetProfileId: number;
}

/**
 * Risposta da POST /api/profiles/actions/unfollow
 */
export interface UnfollowResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// TIPI PROPS COMPONENTI
// ============================================================================

/**
 * Props per componente ProfileHeader.
 */
export interface ProfileHeaderProps {
  /** Dati del profilo */
  profile: Profile;
  /** Stato del follow */
  followStatus: FollowStatus;
  /** Callback per seguire */
  onFollow: () => Promise<void>;
  /** Callback per smettere di seguire */
  onUnfollow: () => Promise<void>;
  /** Stato di caricamento */
  isLoading?: boolean;
  /** Callback click su immagine profilo */
  onProfileImageClick?: () => void;
  /** Callback click su storia */
  onStoryClick?: () => void;
  /** Stato upload immagine */
  isUploadingImage?: boolean;
}

/**
 * Props per componente ProfileStats.
 */
export interface ProfileStatsProps {
  /** Numero di post */
  postsCount: number;
  /** Numero di follower */
  followersCount: number;
  /** Numero di following */
  followingCount: number;
  /** Callback click su follower */
  onFollowersClick?: () => void;
  /** Callback click su following */
  onFollowingClick?: () => void;
  /** Può vedere contenuti privati */
  canViewContent?: boolean;
}

/**
 * Props per componente ProfileBio.
 */
export interface ProfileBioProps {
  /** Nome completo */
  fullName: string | null;
  /** Biografia */
  bio: string | null;
  /** URL sito web */
  websiteUrl: string | null;
}

/**
 * Props per componente ProfileActions.
 */
export interface ProfileActionsProps {
  /** È il proprio profilo */
  isOwnProfile: boolean;
  /** Sta seguendo */
  isFollowing: boolean;
  /** Richiesta in attesa */
  isPending: boolean;
  /** Profilo privato */
  isPrivate: boolean;
  /** È seguito da questo profilo */
  isFollowedBy: boolean;
  /** Callback per seguire */
  onFollow: () => Promise<void>;
  /** Callback per smettere di seguire */
  onUnfollow: () => Promise<void>;
  /** Stato di caricamento */
  isLoading?: boolean;
}

/**
 * Props per componente ProfileTabs.
 */
export interface ProfileTabsProps {
  /** Tab attivo */
  activeTab: ProfileTab;
  /** Callback cambio tab */
  onTabChange: (tab: ProfileTab) => void;
  /** Numero di post */
  postsCount: number;
  /** Mostra tab salvati (solo proprio profilo) */
  showTagged: boolean;
  /** Mostra tab reels se il profilo ha reels */
  hasReels?: boolean;
  /** Mostra tab taggati se può vedere (pubblico o following) */
  canViewTagged?: boolean;
}

/**
 * Opzioni tab profilo.
 */
export type ProfileTab = 'posts' | 'reels' | 'saved' | 'tagged';

/**
 * Props per componente ProfileGrid.
 */
export interface ProfileGridProps {
  /** Lista dei post */
  posts: Post[];
  /** Stato di caricamento */
  isLoading: boolean;
  /** Callback per caricare altri post */
  onLoadMore?: () => void;
  /** Se ci sono altri post */
  hasMore?: boolean;
  /** Tab corrente */
  tab?: ProfileTab;
  /** È il proprio profilo */
  isOwnProfile?: boolean;
  /** Callback per creare post */
  onCreatePost?: () => void;
  /** Callback click su post */
  onPostClick?: (post: Post) => void;
}

/**
 * Props per componente ProfilePrivateLock.
 */
export interface ProfilePrivateLockProps {
  /** Username del profilo */
  username: string;
  /** Richiesta di follow in attesa */
  isPending: boolean;
}

/**
 * Props per componente StoriesHighlights.
 */
export interface StoriesHighlightsProps {
  /** Lista degli highlight */
  highlights: StoryHighlight[];
  /** ID del profilo */
  profileId: number;
}

// ============================================================================
// TIPI UTILITY
// ============================================================================

/**
 * Enum stato pagina profilo.
 */
export enum ProfileState {
  /** Proprio profilo */
  OWN_PROFILE = 'own_profile',
  /** Profilo pubblico che si segue */
  PUBLIC_FOLLOWING = 'public_following',
  /** Profilo pubblico che non si segue */
  PUBLIC_NOT_FOLLOWING = 'public_not_following',
  /** Profilo privato che si segue */
  PRIVATE_FOLLOWING = 'private_following',
  /** Profilo privato che non si segue */
  PRIVATE_NOT_FOLLOWING = 'private_not_following',
  /** Profilo privato con richiesta in attesa */
  PRIVATE_PENDING = 'private_pending',
}

/**
 * Tipi di errore per pagine profilo.
 */
export type ProfileError =
  | { type: 'not_found'; message: string }
  | { type: 'cannot_view'; reason: 'private' | 'blocked' }
  | { type: 'network_error'; message: string }
  | { type: 'server_error'; message: string };
