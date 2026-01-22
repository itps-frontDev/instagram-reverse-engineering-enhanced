/**
 * @fileoverview Barrel export per componenti Profile.
 * 
 * Permette di importare i componenti profilo da un unico punto:
 * import { ProfileHeader, ProfileGrid, ProfileStats } from '@/components/profile';
 * 
 * @module components/profile
 */

// Componenti principali
export { default as ProfileHeader } from './ProfileHeader';
export { default as ProfileGrid } from './ProfileGrid';
export { default as ProfileStats } from './ProfileStats';
export { default as ProfileBio } from './ProfileBio';
export { default as ProfileActions } from './ProfileActions';
export { default as ProfileTabs } from './ProfileTabs';

// Stati e UI
export { default as ProfileEmptyState } from './ProfileEmptyState';
export { default as ProfilePrivateLock } from './ProfilePrivateLock';
export { default as ProfilePreviewCard } from './ProfilePreviewCard';
export { default as ProfileImageModal } from './ProfileImageModal';

// Stories
export { default as StoriesHighlights } from './StoriesHighlights';
export { default as NewHighlight } from './NewHighlight';

// Modals
export { default as FollowersModal } from './FollowersModal';
export { default as UnfollowModal } from './UnfollowModal';

// Re-export icons
export * from './icons';
