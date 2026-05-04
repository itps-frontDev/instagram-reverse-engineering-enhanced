/**
 * @fileoverview Skeleton loader per notifiche.
 *
 * Placeholder animato mostrato durante il caricamento delle notifiche.
 * Simula una lista di notifiche con avatar e testo.
 * 
 * STRUTTURA SIMULATA:
 * - 10 righe di notifiche
 * - Avatar circolare per ogni notifica
 * - Due linee di testo (titolo e descrizione)
 * 
 * @module components/common/skeletons/NotificationsSkeleton
 */

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di righe skeleton da mostrare */
const SKELETON_ROWS = 10;

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per lista notifiche.
 * 
 * @returns Placeholder animato per notifiche
 */
export default function NotificationsSkeleton() {
  return (
    <div className="px-4 py-4 space-y-3">
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 animate-pulse">
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
