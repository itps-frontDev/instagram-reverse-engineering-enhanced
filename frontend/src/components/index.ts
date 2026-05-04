/**
 * @fileoverview Barrel export principale per tutti i componenti.
 * 
 * Permette di importare i componenti da un unico punto:
 * import { ProfilePicture, LoadingSpinner, Post } from '@/components';
 * 
 * Per import più specifici, usa le sottocartelle:
 * import { ProfileHeader } from '@/components/profile';
 * import { ChatSkeleton } from '@/components/common/skeletons';
 * 
 * @module components
 */

// Componenti root-level
export { default as ProfilePicture } from './ProfilePicture';
export { default as Providers } from './Providers';

// Re-export da sottocartelle
export * from './common';
export * from './ui';
export * from './direct';
export * from './explore';
export * from './feed';
export * from './layout';
export * from './profile';
export * from './settings';
