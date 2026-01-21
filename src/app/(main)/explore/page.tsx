/**
 * @fileoverview Pagina Esplora.
 * 
 * Grid di post popolari e suggerimenti.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ExploreGrid from '@/components/explore/ExploreGrid';
import MobileSearchBar from '@/components/feed/MobileSearchBar';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { FeedPost, GetFeedResponse } from '@/types/feed';

export default function ExplorePage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchExplorePosts(0, true);
  }, []);

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

  const fetchExplorePosts = async (currentOffset: number, isInitial = false) => {
    try {
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const response = await fetch(`/api/explore?limit=30&offset=${currentOffset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch explore posts');
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
      console.error('Error fetching explore posts:', err);
      setError('Impossibile caricare i post');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch('/api/feed/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });

      if (!response.ok) throw new Error('Failed to like post');

      const data = await response.json();

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
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

      if (!response.ok) throw new Error('Failed to save post');

      const data = await response.json();

      // Update local state
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
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

      if (!response.ok) throw new Error('Failed to comment');

      // Update comments count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
    } catch (err) {
      console.error('Error commenting:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-2xl font-semibold mb-6">Esplora</h1>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size={48} />
        </div>
      </div>
    );
  }

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

  return (
    <div className="w-full min-h-screen">
      {/* Mobile Search Bar - visible only on mobile */}
      <MobileSearchBar />
      
      <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
        <h1 className="text-2xl font-semibold mb-6 hidden lg:block">Esplora</h1>
        
        <ExploreGrid
          posts={posts}
          onLike={handleLike}
          onSave={handleSave}
          onComment={handleComment}
        />

        {/* Loading indicator for infinite scroll */}
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

        {/* Intersection observer target */}
        <div ref={observerTarget} className="h-16 flex items-center justify-center">
          {(isLoadingMore || isLoading) && hasMore && <LoadingSpinner size={32} />}
        </div>
      </div>
    </div>
  );
}
