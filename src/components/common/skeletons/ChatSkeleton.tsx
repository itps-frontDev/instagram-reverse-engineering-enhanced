/**
 * @fileoverview Skeleton loader per la chat.
 * 
 * Placeholder animato mostrato durante il caricamento dei messaggi.
 * Simula la struttura dei messaggi con bolle alternate sinistra/destra.
 * 
 * @module components/common/skeletons/ChatSkeleton
 */

// ============================================================================
// COMPONENTE
// ============================================================================

// Predefined widths for skeleton messages to avoid using Math.random() during render
const SKELETON_WIDTHS = [180, 220, 150, 200, 170, 190];

/**
 * Skeleton loader per messaggi chat.
 * 
 * Mostra placeholder animati che simulano la struttura dei messaggi
 * mentre i dati reali vengono caricati.
 * 
 * @returns Skeleton animato per chat
 */
export default function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
      {/* Skeleton messaggi - alternati sinistra e destra */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className={`flex gap-2 ${i % 3 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          {i % 3 === 0 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          )}
          <div
            className={`rounded-3xl p-3 ${
              i % 3 === 0
                ? 'bg-gray-200 dark:bg-gray-700'
                : 'bg-gray-200 dark:bg-gray-700'
            } animate-pulse`}
            style={{
              width: `${SKELETON_WIDTHS[i]}px`,
              height: '40px',
            }}
          />
        </div>
      ))}
    </div>
  );
}
