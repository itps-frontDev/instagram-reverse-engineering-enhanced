/**
 * @fileoverview Skeleton loader per post del feed.
 *
 * Placeholder animato mostrato durante il caricamento dei post.
 * Simula la struttura di un post con header, immagine e azioni.
 * 
 * STRUTTURA SIMULATA:
 * - Header con avatar e username
 * - Immagine quadrata (aspect-square)
 * - Pulsanti azione (like, commento, condividi)
 * - Conteggio like e didascalia
 * - Timestamp
 * 
 * @module components/common/skeletons/FeedPostSkeleton
 */

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per singolo post del feed.
 * 
 * @returns Placeholder animato per post
 */
export default function FeedPostSkeleton() {
  return (
    <article className="w-full bg-white dark:bg-black border border-[#dbdbdb] dark:border-[#262626] rounded-xl animate-pulse">
      {/* Post Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1">
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Post Image */}
      <div className="w-full aspect-square bg-gray-200 dark:bg-gray-700" />

      {/* Post Actions */}
      <div className="px-4 py-3 space-y-3">
        {/* Icons */}
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Likes */}
        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />

        {/* Caption */}
        <div className="space-y-2">
          <div className="h-3 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Timestamp */}
        <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </article>
  );
}
