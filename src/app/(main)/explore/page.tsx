/**
 * @fileoverview Pagina Esplora.
 * 
 * Grid di post popolari e suggerimenti.
 */

'use client';

import { useState, useEffect } from 'react';
import ExploreGrid from '@/components/explore/ExploreGrid';
import type { FeedPost, GetFeedResponse } from '@/lib/types/feed';

export default function ExplorePage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/explore?limit=30');
      
      if (!response.ok) {
        throw new Error('Failed to fetch explore posts');
      }

      const data: GetFeedResponse = await response.json();
      setPosts(data.posts);
    } catch (err) {
      console.error('Error fetching explore posts:', err);
      setError('Impossibile caricare i post');
    } finally {
      setIsLoading(false);
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
        <div className="grid grid-cols-3 gap-1 md:gap-2">
          {Array(30)
            .fill(null)
            .map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-gray-200 animate-pulse rounded"
              />
            ))}
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
            onClick={fetchExplorePosts}
            className="mt-4 text-blue-500 hover:text-blue-600 font-semibold"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
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
    <div className="max-w-5xl mx-auto px-4 pt-8 pb-8">
      <h1 className="text-2xl font-semibold mb-6">Esplora</h1>
      
      <ExploreGrid
        posts={posts}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleComment}
      />
    </div>
  );
}
