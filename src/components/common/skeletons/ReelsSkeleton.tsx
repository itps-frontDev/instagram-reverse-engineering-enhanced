/**
 * @fileoverview Skeleton loader per pagina Reels.
 *
 * Placeholder animato mostrato durante il caricamento dei reels.
 * Simula il layout full-screen verticale con video e sidebar azioni.
 * 
 * STRUTTURA SIMULATA:
 * - Area video principale (aspect 9:16)
 * - Sidebar azioni destra (like, commenti, share, save)
 * - Info autore in basso
 * - Caption e audio info
 * 
 * @module components/common/skeletons/ReelsSkeleton
 */

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per pagina Reels.
 * 
 * @returns Placeholder animato per Reels
 */
export default function ReelsSkeleton() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center animate-pulse">
      {/* Container reel principale */}
      <div className="relative h-full max-h-[100vh] aspect-[9/16] max-w-[calc(100vh*9/16)]">
        {/* Area video */}
        <div className="absolute inset-0 bg-gray-800 rounded-lg" />
        
        {/* Progress bar in alto */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-700 rounded-t-lg" />
        
        {/* Header con info autore */}
        <div className="absolute top-4 left-4 right-16 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-700" />
          <div className="flex flex-col gap-1.5">
            <div className="h-4 w-24 bg-gray-700 rounded" />
            <div className="h-3 w-16 bg-gray-700 rounded" />
          </div>
          <div className="h-8 w-20 bg-gray-700 rounded-lg ml-2" />
        </div>

        {/* Sidebar azioni destra */}
        <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
          {/* Like */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
            <div className="h-3 w-8 bg-gray-700 rounded" />
          </div>
          
          {/* Commenti */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
            <div className="h-3 w-8 bg-gray-700 rounded" />
          </div>
          
          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
          </div>
          
          {/* Save */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
          </div>
          
          {/* More */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-gray-700" />
          </div>
        </div>

        {/* Info in basso */}
        <div className="absolute bottom-4 left-4 right-20">
          {/* Username */}
          <div className="flex items-center gap-2 mb-3">
            <div className="h-4 w-24 bg-gray-700 rounded" />
          </div>
          
          {/* Caption */}
          <div className="space-y-2 mb-3">
            <div className="h-3 w-full bg-gray-700 rounded" />
            <div className="h-3 w-3/4 bg-gray-700 rounded" />
          </div>
          
          {/* Audio info */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded" />
            <div className="h-3 w-32 bg-gray-700 rounded" />
          </div>
        </div>

        {/* Indicatore play centrale */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gray-700/50" />
        </div>
      </div>
    </div>
  );
}
