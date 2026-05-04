/**
 * @fileoverview Skeleton loader per suggerimenti.
 *
 * Placeholder animato mostrato durante il caricamento dei suggerimenti sidebar.
 * Simula la struttura con utente corrente e lista suggeriti.
 * 
 * STRUTTURA SIMULATA:
 * - Info utente corrente (avatar grande + username)
 * - Header sezione suggerimenti
 * - 5 utenti suggeriti (avatar + nome + pulsante)
 * 
 * POSIZIONAMENTO:
 * - Nascosto sotto 2xl (< 1536px)
 * - Fisso a destra del feed principale
 * 
 * @module components/common/skeletons/SuggestionsSkeleton
 */

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di suggerimenti skeleton da mostrare */
const SKELETON_SUGGESTIONS = 5;

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per sidebar suggerimenti.
 * 
 * @returns Placeholder animato per suggerimenti
 */
export default function SuggestionsSkeleton() {
  return (
    <aside className="hidden 2xl:block fixed left-1/2 ml-[calc(710px/2+20px)] top-24 w-80">
      <div className="space-y-4 animate-pulse">
        {/* Info utente corrente Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Intestazione suggerimenti */}
        <div className="mt-6 flex items-center justify-between">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Utenti suggeriti */}
        <div className="space-y-3">
          {Array.from({ length: SKELETON_SUGGESTIONS }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
