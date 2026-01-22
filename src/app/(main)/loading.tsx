/**
 * @fileoverview Stato di caricamento della homepage.
 * 
 * Scheletro UI per la pagina feed principale.
 * Viene mostrato durante la navigazione e il caricamento dei dati.
 * 
 * COMPONENTI SKELETON:
 * - StoriesSkeleton: placeholder per il carosello storie
 * - FeedPostSkeleton: placeholder per i post (x3)
 * - SuggestionsSkeleton: placeholder per la sidebar suggerimenti
 * 
 * @module app/(main)/loading
 */

import StoriesSkeleton from '@/components/common/skeletons/StoriesSkeleton';
import FeedPostSkeleton from '@/components/common/skeletons/FeedPostSkeleton';
import SuggestionsSkeleton from '@/components/common/skeletons/SuggestionsSkeleton';

// ============================================================================
// COMPONENTE LOADING
// ============================================================================

/**
 * Scheletro di caricamento per la homepage.
 * 
 * Replica la struttura della pagina feed con placeholder animati
 * per migliorare la percezione di velocità di caricamento.
 * 
 * @returns UI skeleton della homepage
 */
export default function HomeLoading() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Contenitore principale */}
      <div className="w-full max-w-[470px] flex flex-col items-center">
        {/* Skeleton storie */}
        <div className="w-full mb-6">
          <StoriesSkeleton />
        </div>

        {/* Skeleton post del feed */}
        <div className="w-full flex flex-col items-center space-y-3">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      </div>

      {/* Skeleton sidebar suggerimenti */}
      <SuggestionsSkeleton />
    </div>
  );
}
