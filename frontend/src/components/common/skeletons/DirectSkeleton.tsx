/**
 * @fileoverview Skeleton loader per pagina messaggi diretti.
 *
 * Placeholder animato mostrato durante il caricamento della pagina Direct.
 * Simula il layout a due colonne con lista contatti e area chat.
 * 
 * STRUTTURA SIMULATA:
 * - Colonna sinistra: header + lista 8 contatti
 * - Colonna destra: header chat + area messaggi vuota
 * 
 * @module components/common/skeletons/DirectSkeleton
 */

// ============================================================================
// COSTANTI
// ============================================================================

/** Numero di contatti skeleton da mostrare */
const SKELETON_CONTACTS = 8;

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per pagina messaggi diretti.
 * 
 * @returns Placeholder animato per Direct
 */
export default function DirectSkeleton() {
  return (
    <div className="flex h-[calc(100vh-60px)] lg:h-screen animate-pulse">
      {/* Sidebar contatti */}
      <div className="w-[72px] lg:w-[400px] border-r border-[#262626] flex flex-col">
        {/* Header sidebar */}
        <div className="h-[75px] border-b border-[#262626] px-4 flex items-center justify-between">
          <div className="hidden lg:block h-6 w-32 bg-gray-700 rounded" />
          <div className="hidden lg:flex gap-2">
            <div className="h-6 w-6 bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-700 rounded" />
          </div>
        </div>

        {/* Search bar (solo desktop) */}
        <div className="hidden lg:block px-4 py-3">
          <div className="h-10 bg-gray-700 rounded-lg" />
        </div>

        {/* Lista contatti */}
        <div className="flex-1 overflow-hidden">
          {Array.from({ length: SKELETON_CONTACTS }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2 lg:py-3">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gray-700 flex-shrink-0" />
              {/* Info (solo desktop) */}
              <div className="hidden lg:flex flex-col flex-1 gap-2">
                <div className="h-4 w-24 bg-gray-700 rounded" />
                <div className="h-3 w-36 bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Area chat principale */}
      <div className="flex-1 flex flex-col">
        {/* Header chat */}
        <div className="h-[75px] border-b border-[#262626] px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-700" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-28 bg-gray-700 rounded" />
              <div className="h-3 w-20 bg-gray-700 rounded" />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="h-6 w-6 bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-700 rounded" />
            <div className="h-6 w-6 bg-gray-700 rounded" />
          </div>
        </div>

        {/* Area messaggi (vuota con placeholder) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-24 h-24 rounded-full border-4 border-gray-700 flex items-center justify-center">
            <div className="w-12 h-10 bg-gray-700 rounded" />
          </div>
          <div className="h-5 w-40 bg-gray-700 rounded" />
          <div className="h-4 w-56 bg-gray-700 rounded" />
        </div>

        {/* Input messaggio */}
        <div className="p-4 border-t border-[#262626]">
          <div className="h-11 bg-gray-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}
