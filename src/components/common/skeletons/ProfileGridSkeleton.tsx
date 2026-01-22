/**
 * @fileoverview Skeleton loader per griglia profilo.
 *
 * Placeholder animato mostrato durante il caricamento dei post del profilo.
 * Simula una griglia 3x4 di post quadrati.
 * 
 * STRUTTURA SIMULATA:
 * - Griglia 3 colonne
 * - 12 celle quadrate (4 righe)
 * - Gap responsive (1px mobile, 2px desktop)
 * 
 * @module components/common/skeletons/ProfileGridSkeleton
 */

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di celle skeleton da mostrare */
const SKELETON_CELLS = 12;

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per griglia post profilo.
 * 
 * @returns Placeholder animato per griglia
 */
export default function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2 animate-pulse">
      {Array.from({ length: SKELETON_CELLS }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded"
        />
      ))}
    </div>
  );
}
