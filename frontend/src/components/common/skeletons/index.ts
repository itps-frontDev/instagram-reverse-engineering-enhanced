/**
 * @fileoverview Barrel export per tutti i componenti Skeleton.
 * 
 * Permette di importare tutti gli skeleton da un unico punto:
 * import { FeedPostSkeleton, ProfileHeaderSkeleton } from '@/components/common/skeletons';
 * 
 * @module components/common/skeletons
 */

// Skeleton per pagine principali
export { default as DirectSkeleton } from './DirectSkeleton';
export { default as ExploreSkeleton } from './ExploreSkeleton';
export { default as ReelsSkeleton } from './ReelsSkeleton';
export { default as StoryViewerSkeleton } from './StoryViewerSkeleton';

// Skeleton per componenti feed
export { default as FeedPostSkeleton } from './FeedPostSkeleton';
export { default as StoriesSkeleton } from './StoriesSkeleton';
export { default as SuggestionsSkeleton } from './SuggestionsSkeleton';

// Skeleton per componenti profilo
export { default as ProfileGridSkeleton } from './ProfileGridSkeleton';
export { default as ProfileHeaderSkeleton } from './ProfileHeaderSkeleton';

// Skeleton per notifiche
export { default as NotificationsSkeleton } from './NotificationsSkeleton';

// Skeleton per chat/direct
export { default as ChatSkeleton } from './ChatSkeleton';
