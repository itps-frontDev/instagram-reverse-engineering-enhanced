/**
 * @fileoverview Skeleton loader per pagina Esplora.
 *
 * Placeholder animato mostrato durante il caricamento della griglia Esplora.
 * Simula il layout mosaico Instagram con celle di dimensioni diverse.
 * 
 * STRUTTURA SIMULATA:
 * - Griglia 3 colonne
 * - Pattern mosaico: 2 righe normali + 1 riga con cella grande
 * - 18 celle totali (6 righe)
 * 
 * PATTERN GRIGLIA:
 * - Righe 1-2: 3 celle normali
 * - Riga 3: 1 cella 2x2 + 2 celle normali impilate
 * - Righe 4-5: 3 celle normali
 * - Riga 6: ripete pattern riga 3
 * 
 * @module components/common/skeletons/ExploreSkeleton
 */

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Skeleton per pagina Esplora.
 * 
 * @returns Placeholder animato per Esplora
 */
export default function ExploreSkeleton() {
  return (
    <div className="w-full max-w-[935px] mx-auto px-0 animate-pulse">
      {/* Prima sezione: 2 righe normali */}
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`row1-${i}`}
            className="aspect-square bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      {/* Seconda sezione: pattern mosaico */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {/* Cella grande 2x2 */}
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 row-span-2 col-span-1" style={{ aspectRatio: '1/1' }} />
        
        {/* 2 celle impilate a destra della grande */}
        <div className="col-span-2 grid grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`mosaic1-${i}`}
              className="aspect-square bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>

      {/* Terza sezione: 2 righe normali */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`row2-${i}`}
            className="aspect-square bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>

      {/* Quarta sezione: pattern mosaico invertito */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {/* 2 celle impilate a sinistra */}
        <div className="col-span-2 grid grid-cols-2 gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={`mosaic2-${i}`}
              className="aspect-square bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
        
        {/* Cella grande 2x2 a destra */}
        <div className="aspect-square bg-gray-200 dark:bg-gray-700 row-span-2" style={{ aspectRatio: '1/1' }} />
      </div>

      {/* Quinta sezione: ulteriori celle */}
      <div className="grid grid-cols-3 gap-1 mt-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`row3-${i}`}
            className="aspect-square bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}
