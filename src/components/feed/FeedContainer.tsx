/**
 * @fileoverview Container principale del feed.
 * 
 * Componente client che gestisce il caricamento e lo stato del feed
 * con supporto infinite scroll.
 * 
 * FUNZIONALITÀ:
 * - Fetch iniziale e paginato dei post
 * - Infinite scroll con Intersection Observer
 * - Gestione like, salvataggio e commenti
 * - Skeleton loading durante caricamento
 * - Gestione errori e stati vuoti
 * 
 * @module components/feed/FeedContainer
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Post from './Post';
import {FeedPostSkeleton} from '@/components/common/skeletons';
import { LoadingSpinner } from '@/components/common';
import type { FeedPost } from '@/types/feed';

export default function FeedContainer() {
  const [posts, setPosts] = useState<FeedPost[]>([]); // Post nel feed
  const [loading, setLoading] = useState(true); // Stato di caricamento
  const [error, setError] = useState<string | null>(null); // Stato di errore
  const [hasMore, setHasMore] = useState(true); // Indica se ci sono più post da caricare
  const [offset, setOffset] = useState(0); // Offset per la paginazione
  const observerTarget = useRef<HTMLDivElement>(null); // Riferimento per l'infinite scroll

  const fetchPosts = async (currentOffset: number = 0) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/feed?limit=20&offset=${currentOffset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch feed');
      }

      const data = await response.json();

      if (currentOffset === 0) {
        setPosts(data.posts);
      } else {
        setPosts((prev) => [...prev, ...data.posts]);
      }

      setHasMore(data.hasMore);
      setOffset(currentOffset + data.posts.length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(0);
  }, []);

  // Infinite scroll con Intersection Observer (quando l’utente arriva in fondo al feed, carica automaticamente altri post)
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts(offset);
        }
      },
      { threshold: 0.1 }
    );
    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [offset, hasMore, loading]);

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      const data = await response.json();

      // Aggiorna post nello stato
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                is_liked_by_current_user: data.liked,
                likes_count: data.likes_count,
              }
            : post
        )
      );
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleSave = async (postId: number) => {
    try {
      const response = await fetch('/api/feed/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) {
        throw new Error('Failed to save post');
      }

      const data = await response.json();

      // Aggiorna post nello stato
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, is_saved_by_current_user: data.saved }
            : post
        )
      );
    } catch (err) {
      console.error('Error saving post:', err);
    }
  };

  const handleComment = async (postId: number, text: string) => {
    try {
      const response = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, text }),
      });

      if (!response.ok) {
        throw new Error('Failed to post comment');
      }

      // Aggiorna conteggio commenti
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="space-y-3">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <FeedPostSkeleton key={i} />
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-[#ED4956]">{error}</p>
        <button
          onClick={() => fetchPosts(0)}
          className="mt-4 text-[#0095F6] font-semibold hover:text-[#004C8B]"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="p-8 text-center text-[#8E8E8E] dark:text-[#A8A8A8]">
        <p>Nessun post da mostrare.</p>
        <p className="text-sm mt-2">Inizia a seguire qualcuno per vedere i loro post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onComment={handleComment}
        />
      ))} {/* div target osservato per l'infinite scroll */}
      {hasMore && (
        <div ref={observerTarget} className="h-16 flex items-center justify-center">
          {loading ? <LoadingSpinner size={32} /> : null}
        </div>
      )}
    </div>
  );
}

