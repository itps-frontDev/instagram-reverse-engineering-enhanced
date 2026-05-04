/**
 * @fileoverview Barrel export per componenti comuni.
 * 
 * Permette di importare i componenti comuni da un unico punto:
 * import { LoadingSpinner, ButtonSpinner, Footer } from '@/components/common';
 * 
 * @module components/common
 */

// Spinner e Loading
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as ButtonSpinner } from './ButtonSpinner';
export { default as InstagramLoadingBar } from './InstagramLoadingBar';

// Icone
export { default as CarouselIcon } from './CarouselIcon';
export { default as MoreOptionsIcon } from './MoreOptionsIcon';
export { default as ShareIcon } from './ShareIcon';
export { default as TagIcon } from './TagIcon';

// UI Elements
export { default as Footer } from './Footer';
export { default as InstagramLogo } from './InstagramLogo';
export { default as VerifiedBadge } from './VerifiedBadge';
export { default as OrDivider } from './OrDivider';
export { default as ErrorMessage } from './ErrorMessage';
export { default as PostHoverOverlay } from './PostHoverOverlay';

// Re-export skeletons
export * from './skeletons';
