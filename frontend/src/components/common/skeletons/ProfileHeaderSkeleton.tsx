/**
 * @fileoverview Skeleton loader per header profilo.
 *
 * Placeholder animato mostrato durante il caricamento dell'header profilo.
 * Simula la struttura completa con avatar, stats e bio.
 * 
 * STRUTTURA SIMULATA:
 * - Avatar grande (77px mobile, 150px desktop)
 * - Username e pulsanti azione
 * - Statistiche (post, follower, following)
 * - Nome e bio
 * 
 * @module components/common/skeletons/ProfileHeaderSkeleton
 */

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per header profilo.
 * 
 * @returns Placeholder animato per header
 */
export default function ProfileHeaderSkeleton() {
  return (
    <header className="px-4 py-4 md:py-6 animate-pulse">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start">
          {/* Avatar Skeleton */}
          <div className="w-[77px] h-[77px] md:w-[150px] md:h-[150px] rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

          {/* Info Skeleton */}
          <div className="flex-1 w-full space-y-4">
            {/* Username and Actions */}
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="flex gap-2">
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center md:justify-start">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
