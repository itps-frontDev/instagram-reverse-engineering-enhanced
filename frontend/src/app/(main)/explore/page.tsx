/**
 * @fileoverview Pagina Esplora di Instagram.
 * 
 * Mostra una griglia di post popolari con infinite scroll.
 * Permette di scoprire nuovi contenuti e profili da seguire.
 * 
 * FUNZIONALITÀ:
 * - Griglia di post in stile Instagram (masonry-like)
 * - Infinite scroll con Intersection Observer
 * - Like, salvataggio e commenti sui post
 * - Barra di ricerca mobile
 * 
 * LAYOUT:
 * - Griglia responsive (3 colonne)
 * - Gap ridotto per effetto mosaico
 * - Titolo visibile solo su desktop
 * 
 * @module app/(main)/explore/page
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ExploreGrid from '@/components/explore/ExploreGrid';
import {MobileSearchBar} from '@/components/feed';
import { LoadingSpinner } from '@/components/common';
import {ExploreSkeleton} from '@/components/common/skeletons';
import type { FeedPost, GetFeedResponse } from '@/types/feed';
import { toggleLikeAction } from '@/features/likes';

// ============================================================================
// COMPONENTE PAGINA
// ============================================================================

/**
 * Pagina Esplora per la scoperta di nuovi contenuti.
 * 
 * Carica post popolari con infinite scroll e permette
 * interazioni (like, save, comment) direttamente dalla griglia.
 */
export default function ExplorePage() {
  // -------------------------------------------------------------------------
  // Stato dei dati
  // -------------------------------------------------------------------------
  
  /** Lista dei post caricati */
  const [posts, setPosts] = useState<FeedPost[]>([]);
  
  /** Offset per paginazione */
  const [offset, setOffset] = useState(0);
  
  /** Indica se ci sono altri post da caricare */
  const [hasMore, setHasMore] = useState(true);
  
  // -------------------------------------------------------------------------
  // Stato UI
  // -------------------------------------------------------------------------
  
  /** Caricamento iniziale in corso */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Caricamento pagina successiva in corso */
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  /** Messaggio di errore */
  const [error, setError] = useState<string | null>(null);
  
  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  
  /** Target per Intersection Observer (infinite scroll) */
  const observerTarget = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Effetti: Caricamento iniziale
  // -------------------------------------------------------------------------

  /** Carica i primi post al mount */
  useEffect(() => {
    fetchExplorePosts(0, true);
  }, []);

  // -------------------------------------------------------------------------
  // Effetti: Infinite scroll
  // -------------------------------------------------------------------------

  /** Imposta l'Intersection Observer per infinite scroll */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchExplorePosts(offset);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [offset, hasMore, isLoading, isLoadingMore]);

  // -------------------------------------------------------------------------
  // Funzioni: Fetch dati
  // -------------------------------------------------------------------------

  /**
   * Carica i post per la pagina Esplora.
   * 
   * @param currentOffset - Offset per paginazione
   * @param isInitial - Se true, è il caricamento iniziale
   */
  const fetchExplorePosts = async (currentOffset: number, isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await fetch(`/api/explore?limit=30&offset=${currentOffset}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei post');
      }

      const data: GetFeedResponse = await response.json();
      
      if (isInitial) {
        setPosts(data.posts);
      } else {
        setPosts((prevPosts) => [...prevPosts, ...data.posts]);
      }
      
      setHasMore(data.hasMore);
      setOffset(currentOffset + data.posts.length);
    } catch (err) {
      console.error('Errore fetch post esplora:', err);
      setError('Impossibile caricare i post');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // -------------------------------------------------------------------------
  // Handlers: Interazioni post
  // -------------------------------------------------------------------------

  /**
   * Gestisce il like su un post.
   * Aggiorna lo stato locale con la risposta del server.
   */
  const handleLike = async (postId: number) => {
    const result = await toggleLikeAction({ likeableType: 'post', likeableId: postId });
    if (!result.success) {
      console.error('Errore like post:', result.error);
      return;
    }
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, is_liked_by_current_user: result.data.liked, likes_count: result.data.count }
          : post
      )
    );
  };

  /**
   * Gestisce il salvataggio di un post.
   * Aggiorna lo stato locale con la risposta del server.
   */
  const handleSave = async (postId: number) => {
    try {
      const response = await fetch('/api/feed/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) throw new Error('Errore salvataggio post');

      const data = await response.json();

      // Aggiorna lo stato locale
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, is_saved_by_current_user: data.saved }
            : post
        )
      );
    } catch (err) {
      console.error('Errore salvataggio post:', err);
    }
  };

  /**
   * Gestisce l'aggiunta di un commento.
   * Aggiorna il contatore commenti locale.
   */
  const handleComment = async (postId: number, text: string) => {
    try {
      const response = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text }),
      });

      if (!response.ok) throw new Error('Errore commento');

      // Aggiorna il contatore commenti
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Errore commento:', err);
    }
  };

  // -------------------------------------------------------------------------
  // Render: Stati speciali
  // -------------------------------------------------------------------------

  /** Stato di caricamento iniziale */
  if (isLoading) {
    return (
      <div className="w-full min-h-screen">
        <MobileSearchBar />
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
          <h1 className="text-2xl font-semibold mb-6 hidden lg:block">Esplora</h1>
          <ExploreSkeleton />
        </div>
      </div>
    );
  }

  /** Stato di errore */
  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-semibold mb-6">Esplora</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => fetchExplorePosts(0, true)}
            className="mt-4 text-blue-500 hover:text-blue-600 font-semibold"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  /** Stato vuoto (nessun post) */
  if (posts.length === 0 && !isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-semibold mb-6">Esplora</h1>
        <div className="text-center py-12">
          <p className="text-gray-600">Nessun post da mostrare</p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Render: Contenuto principale
  // -------------------------------------------------------------------------
  return (
    <div className="w-full min-h-screen">
      {/* Barra di ricerca mobile - visibile solo su schermi piccoli */}
      <MobileSearchBar />
      
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        {/* Titolo - nascosto su mobile */}
        <h1 className="text-2xl font-semibold mb-6 hidden lg:block">Esplora</h1>
        
        {/* Griglia post */}
        <ExploreGrid
          posts={posts}
          onLike={handleLike}
          onSave={handleSave}
          onComment={handleComment}
        />

        {/* Skeleton durante caricamento pagine successive */}
        {isLoadingMore && (
          <div className="grid grid-cols-3 gap-1 md:gap-2 mt-1 md:mt-2">
            {Array(9)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 animate-pulse rounded"
                />
              ))}
          </div>
        )}

        {/* Target per Intersection Observer */}
        <div ref={observerTarget} className="h-16 flex items-center justify-center">
          {(isLoadingMore || isLoading) && hasMore && <LoadingSpinner size={32} />}
        </div>
      </div>
    </div>
  );
}
