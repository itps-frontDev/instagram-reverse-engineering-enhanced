/**
 * @fileoverview Griglia post profilo utente.
 *
 * Visualizza i post dell'utente in una griglia a 3 colonne con aspect ratio 3:4
 * (formato verticale Instagram 2025). Supporta infinite scroll per caricare
 * altri post automaticamente quando l'utente scorre verso il basso.
 * 
 * LAYOUT:
 * - 3 colonne con gap minimo (1px mobile, 3px desktop)
 * - Aspect ratio 3:4 per ogni cella (formato verticale)
 * - Responsive: stesso layout su tutte le dimensioni
 * 
 * FUNZIONALITÀ:
 * - Infinite scroll con Intersection Observer
 * - Overlay hover con conteggi like/commenti (PostHoverOverlay)
 * - Indicatori per video (icona Reels) e caroselli (icona multi-foto)
 * - Stato vuoto personalizzato per ogni tab (posts, reels, saved, tagged)
 * - Click su post apre il modal di dettaglio
 * - Skeleton loading durante il caricamento
 * 
 * COMPONENTI COLLEGATI:
 * - ProfileEmptyState: messaggio quando non ci sono post
 * - PostHoverOverlay: overlay con statistiche al hover
 * - CarouselIcon: indicatore post con più media
 * 
 * @module components/profile/ProfileGrid
 */

'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { ProfileGridProps } from '@/types/profile';
import ProfileEmptyState from './ProfileEmptyState';
import { CarouselIcon, LoadingSpinner, PostHoverOverlay } from '@/components/common';

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * ProfileGrid - Griglia dei post nel profilo utente.
 * 
 * Renderizza una griglia di anteprime post con supporto per:
 * - Immagini e video
 * - Caroselli (post con più media)
 * - Infinite scroll per caricamento progressivo
 * - Overlay interattivi al passaggio del mouse
 * 
 * @param props - Props del componente (vedi ProfileGridProps)
 * @returns Griglia di post o stato vuoto se non ci sono contenuti
 */
export default function ProfileGrid({
  posts,
  isLoading,
  onLoadMore,
  hasMore = false,
  tab = 'posts',
  isOwnProfile = false,
  onCreatePost,
  onPostClick,
}: ProfileGridProps) {
  // ==========================================================================
  // REFS
  // ==========================================================================
  
  /**
   * Ref per l'elemento sentinella dell'infinite scroll.
   * Quando questo elemento entra nel viewport, vengono caricati altri post.
   */
  const observerTarget = useRef<HTMLDivElement>(null);

  // ==========================================================================
  // EFFECTS - INFINITE SCROLL
  // ==========================================================================

  /**
   * Configura l'Intersection Observer per l'infinite scroll.
   * 
   * FUNZIONAMENTO:
   * 1. Crea un observer che monitora quando l'elemento sentinella
   *    (posizionato dopo l'ultimo post) entra nel viewport
   * 2. Quando l'elemento è visibile al 10% (threshold: 0.1), chiama onLoadMore
   * 3. L'observer viene rimosso al cleanup o quando non ci sono più post
   * 
   * CONDIZIONI PER ATTIVAZIONE:
   * - hasMore === true (ci sono altri post da caricare)
   * - onLoadMore è definito (callback disponibile)
   * - isLoading === false (non sta già caricando)
   */
  useEffect(() => {
    // Non attivare se non ci sono più post o se sta caricando
    if (!hasMore || !onLoadMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Carica altri post quando l'elemento sentinella è visibile
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 } // Attiva quando il 10% dell'elemento è visibile
    );

    // Salva il ref corrente per il cleanup
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    // Cleanup: rimuovi l'observer quando il componente si smonta
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  // ==========================================================================
  // RENDER - STATI SPECIALI
  // ==========================================================================

  /**
   * Stato: Caricamento iniziale (nessun post ancora caricato).
   * Mostra uno spinner centrato mentre vengono caricati i primi post.
   */
  if (isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  /**
   * Stato: Nessun post da mostrare.
   * Mostra un messaggio personalizzato in base al tab attivo
   * (posts vuoti, nessun reel, nessun salvato, nessun tag).
   */
  if (posts.length === 0) {
    return <ProfileEmptyState tab={tab} isOwnProfile={isOwnProfile} onCreatePost={onCreatePost} />;
  }

  // ==========================================================================
  // RENDER - GRIGLIA POST
  // ==========================================================================

  return (
    <div>
      {/* 
        GRIGLIA PRINCIPALE
        - 3 colonne fisse su tutte le dimensioni
        - Gap minimo per effetto "mosaico" tipico di Instagram
        - Gap 1px su mobile, 3px su desktop
      */}
      <div className="grid grid-cols-3 gap-[1px] md:gap-[3px]">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 group overflow-hidden cursor-pointer"
          >
            {/* 
              CONTENUTO MEDIA
              Renderizza video o immagine in base al tipo di media.
              I video mostrano anche l'icona Reels in alto a destra.
            */}
            {post.media_type === 'video' ? (
              <>
                {/* Anteprima video (muto, senza controlli) */}
                <video
                  src={post.media_url || undefined}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
                
                {/* Icona Reels/Video - indica che il post è un video */}
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-white drop-shadow-lg"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    aria-label="Video"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="currentColor"/>
                    <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="rgba(0, 0, 0, 0.6)"/>
                  </svg>
                </div>
              </>
            ) : (
              /* Immagine del post con riempimento object-cover */
              <Image
                src={post.media_url || '/images/placeholder.png'}
                alt={post.caption || 'Post'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            )}

            {/* 
              INDICATORE CAROSELLO
              Appare se il post contiene più di un media (carosello).
              Posizionato in alto a destra (stesso posto dell'icona video,
              ma i video non sono mai caroselli in questo contesto).
            */}
            {post.media_count > 1 && (
              <div className="absolute top-2 right-2">
                <CarouselIcon className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}

            {/* 
              OVERLAY HOVER
              Mostra like e commenti quando l'utente passa il mouse.
              Usa il componente riutilizzabile PostHoverOverlay.
            */}
            <PostHoverOverlay 
              likesCount={post.likes_count} 
              commentsCount={post.comments_count} 
            />
          </div>
        ))}
      </div>

      {/* 
        SENTINELLA INFINITE SCROLL
        Elemento invisibile posizionato dopo l'ultimo post.
        Quando entra nel viewport, l'Intersection Observer
        attiva il caricamento di altri post.
      */}
      {hasMore && (
        <div 
          ref={observerTarget}
          className="py-8 text-center"
        >
          {/* 
            SKELETON LOADING
            Mostra placeholder animati mentre carica altri post.
            Simula la struttura della griglia per un effetto fluido.
          */}
          {isLoading && (
            <div className="grid grid-cols-3 gap-[1px] md:gap-[3px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 animate-pulse"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
