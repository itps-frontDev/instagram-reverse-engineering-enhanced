/**
 * @fileoverview Barrel export per icone profilo.
 * 
 * Esporta tutte le icone utilizzate nelle tab e stati vuoti
 * della pagina profilo utente.
 * 
 * ICONE TAB:
 * - PostsTabIcon: griglia 3x3 per la galleria post
 * - ReelsTabIcon: icona video per i reels
 * - SavedTabIcon: segnalibro per i contenuti salvati
 * - TaggedTabIcon: silhouette per i post taggati
 * 
 * ICONE STATO VUOTO:
 * - PostsEmptyIcon: mostrata quando non ci sono post
 * - SavedEmptyIcon: mostrata quando non ci sono salvati
 * - TaggedEmptyIcon: mostrata quando non ci sono tag
 * 
 * @module components/profile/icons
 */

// ============================================================================
// TAB ICONS - Icone per la navigazione tra le sezioni del profilo
// ============================================================================
export { default as PostsTabIcon } from './PostsTabIcon';
export { default as ReelsTabIcon } from './ReelsTabIcon';
export { default as SavedTabIcon } from './SavedTabIcon';
export { default as TaggedTabIcon } from './TaggedTabIcon';

// ============================================================================
// EMPTY STATE ICONS - Icone per stati vuoti delle sezioni
// ============================================================================
export { default as PostsEmptyIcon } from './PostsEmptyIcon';
export { default as SavedEmptyIcon } from './SavedEmptyIcon';
export { default as TaggedEmptyIcon } from './TaggedEmptyIcon';
