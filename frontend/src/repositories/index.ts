/**
 * @fileoverview Repository Barrel Export
 * 
 * Centralizza l'accesso a tutti i moduli repository.
 * Importa da qui per avere import più puliti in tutta l'applicazione.
 * 
 * PATTERN BARREL EXPORT:
 * Un file index.ts che ri-esporta tutti i moduli di una cartella.
 * Permette di importare più cose con un singolo import statement.
 * 
 * SENZA barrel: 
 *   import { userRepository } from '@/repositories/UserRepository';
 *   import { profileRepository } from '@/repositories/ProfileRepository';
 * 
 * CON barrel:
 *   import { userRepository, profileRepository } from '@/repositories';
 * 
 * @module repositories
 * 
 * @example
 * import { 
 *   userRepository, 
 *   profileRepository,
 *   postRepository
 * } from '@/repositories';
 * 
 * // Operazioni utente
 * const user = await userRepository.findById(1);
 * 
 * // Operazioni profilo
 * const profile = await profileRepository.findByUsername('johndoe');
 * 
 * // Operazioni post
 * const feed = await postRepository.getFeed(profileId, 20, 0);
 * 
 */

// ============================================================================
// EXPORT DEI REPOSITORY
// ============================================================================

// User Repository - operazioni sulla tabella users
export { userRepository, type CreateUserData, type UpdateUserData } from './UserRepository';

// Profile Repository - operazioni su profiles e follows
export {
  profileRepository,
  type CreateProfileData,
  type UpdateProfileData,
  type ProfileWithFollowStatus,
  type FollowerWithStatus,
} from './ProfileRepository';

// Post Repository - operazioni su posts, media, like, salvataggi
export {
  postRepository,
  type Post,
  type PostWithProfile,
  type PostMedia,
  type CreatePostData,
  type UpdatePostData,
  type AddMediaData,
  type FeedPostWithDetails,
  type FeedPostForAPI,
  type ReelWithDetails,
  type PostForView,
} from './PostRepository';

// Comment Repository - operazioni sui commenti
export {
  commentRepository,
  type Comment,
  type CommentWithProfile,
  type CommentBase,
  type PostForComment,
} from './CommentRepository';

// Story Repository - operazioni su storie e visualizzazioni
export {
  storyRepository,
  type Story,
  type StoryWithProfile,
  type StoryWithStatus,
  type ProfileStoryGroup,
  type StoryViewer,
  type CreateStoryData,
} from './StoryRepository';

// Direct Message Repository - operazioni su chat e messaggi
export {
  directMessageRepository,
  type Chat,
  type ChatWithDetails,
  type MappedChat,
  type Message,
  type MessageWithSender,
  type PotentialContact,
} from './DirectMessageRepository';
