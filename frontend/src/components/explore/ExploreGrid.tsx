/**
 * @fileoverview Griglia Esplora.
 * 
 * Componente che visualizza i post nella sezione Esplora di Instagram.
 * I post sono mostrati in una griglia quadrata con effetti hover interattivi.
 * 
 * DIFFERENZE DA ProfileGrid:
 * - Aspect ratio quadrato (1:1) invece di 3:4
 * - Numeri formattati (1.5K invece di 1500)
 * - Navigazione tra post con frecce nel modal
 * 
 * FUNZIONALITÀ:
 * - Griglia responsive 3 colonne
 * - Preview immagini/video con aspect ratio quadrato
 * - Indicatori per video e caroselli
 * - Overlay hover con conteggio like e commenti (PostHoverOverlay)
 * - Modal per visualizzazione post completo
 * - Navigazione tra post con frecce
 * 
 * @module components/explore/ExploreGrid
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import type { FeedPost } from '@/types/feed';
import { PostModal } from '@/components/feed';
import { CarouselIcon, PostHoverOverlay } from '@/components/common';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Props per il componente ExploreGrid.
 * 
 * @interface ExploreGridProps
 */
interface ExploreGridProps {
  /** Array dei post da visualizzare */
  posts: FeedPost[];
  /** Callback per like su un post */
  onLike: (postId: number) => void;
  /** Callback per salvare un post */
  onSave: (postId: number) => void;
  /** Callback per commentare un post */
  onComment: (postId: number, text: string) => void;
}

// ============================================================================
// COMPONENTE
// ============================================================================

/**
 * Griglia post per la sezione Esplora.
 * 
 * Visualizza una griglia di post con preview media, indicatori tipo
 * e overlay interattivi al passaggio del mouse.
 * 
 * @param props - Props del componente
 * @returns Griglia di post esplorabile
 */
export default function ExploreGrid({
  posts,
  onLike,
  onSave,
  onComment,
}: ExploreGridProps) {
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const selectedPost = selectedPostIndex !== null ? posts[selectedPostIndex] : null;

  /**
   * Naviga al post successivo nella griglia.
   */
  const handleNext = () => {
    if (selectedPostIndex !== null && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    }
  };

  /**
   * Naviga al post precedente nella griglia.
   */
  const handlePrev = () => {
    if (selectedPostIndex !== null && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post, index) => {
          const firstMedia = post.media[0];
          if (!firstMedia) return null;

          const isVideo = firstMedia.media_type === 'video';

          return (
            <button
              key={`explore-post-${post.id}-${index}`}
              onClick={() => setSelectedPostIndex(index)}
              className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
            >
              {/* Image/Video */}
              {isVideo ? (
                <video
                  src={firstMedia.media_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                />
              ) : (
                <Image
                  src={firstMedia.media_url}
                  alt={post.caption || 'Post'}
                  fill
                  sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                  className="object-cover"
                />
              )}

              {/* Video indicator */}
              {isVideo && (
                <div className="absolute top-2 right-2 z-10">
                  <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
                </div>
              )}

              {/* Multiple images indicator */}
              {post.media.length > 1 && (
                <div className="absolute top-2 right-2">
                  <CarouselIcon className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              )}

              {/* Hover overlay - usa componente riutilizzabile con numeri formattati */}
              <PostHoverOverlay 
                likesCount={post.likes_count} 
                commentsCount={post.comments_count}
                formatNumbers={true}
              />
            </button>
          );
        })}
      </div>

      {/* Post Modal */}
      {selectedPost && selectedPostIndex !== null && (
        <PostModal
          post={selectedPost}
          isOpen={true}
          onClose={() => setSelectedPostIndex(null)}
          onLike={onLike}
          onSave={onSave}
          onComment={onComment}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedPostIndex < posts.length - 1}
          hasPrev={selectedPostIndex > 0}
        />
      )}
    </>
  );
}
