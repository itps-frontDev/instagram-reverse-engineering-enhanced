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
 * const posts = await postRepository.getByProfileId(profileId, 20, 0);
 * 
 */

// ============================================================================
// EXPORT DEI REPOSITORY
// ============================================================================

// User Repository - operazioni sulla tabella users
export { userRepository, type CreateUserData, type UpdateUserData } from './UserRepository';

// Profile Repository - operazioni sulla tabella profiles
export {
  profileRepository,
  type CreateProfileData,
  type UpdateProfileData,
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
  type ReelWithDetails,
  type PostForView,
} from './PostRepository';

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

