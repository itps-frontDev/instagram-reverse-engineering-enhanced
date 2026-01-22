/**
 * @fileoverview Skeleton loader per storie.
 *
 * Placeholder animato mostrato durante il caricamento delle storie.
 * Simula il carosello di storie con cerchi e username.
 * 
 * STRUTTURA SIMULATA:
 * - 6 cerchi storie (82px)
 * - Username sotto ogni cerchio
 * - Layout orizzontale con overflow hidden
 * 
 * @module components/common/skeletons/StoriesSkeleton
 */

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di storie skeleton da mostrare */
const SKELETON_STORIES = 6;

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per carosello storie.
 * 
 * @returns Placeholder animato per storie
 */
export default function StoriesSkeleton() {
  return (
    <div className="rounded-lg py-4 mb-4 mt-20 relative w-full animate-pulse">
      <div className="flex gap-4 justify-start w-full overflow-hidden">
        {Array.from({ length: SKELETON_STORIES }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            {/* Story circle */}
            <div className="w-[82px] h-[82px] rounded-full bg-gray-200 dark:bg-gray-700" />
            {/* Username */}
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
