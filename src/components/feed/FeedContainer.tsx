/**
 * @fileoverview Feed container component
 *
 * Client component that fetches and manages feed posts with infinite scroll.
 */

'use client';

import { useState, useEffect } from 'react';
import Post from './Post';
import type { FeedPost } from '@/lib/types/feed';

export default function FeedContainer() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

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

      // Update post in state
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

      // Update post in state
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

      // Update comments count
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
      <div className="space-y-3 mt-4">
        {Array(3)
          .fill(null)
          .map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-black border border-[#DBDBDB] dark:border-[#262626] max-w-[470px] mx-auto p-4 animate-pulse"
            >
              <div className="h-64 bg-[#EFEFEF] dark:bg-[#262626] rounded" />
            </div>
          ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-8 text-center max-w-[470px] mx-auto">
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
      <div className="mt-4 p-8 text-center text-[#8E8E8E] dark:text-[#A8A8A8] max-w-[470px] mx-auto">
        <p>Nessun post da mostrare.</p>
        <p className="text-sm mt-2">Inizia a seguire qualcuno per vedere i loro post!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-4">
      {posts.map((post) => (
        <Post
          key={post.id}
          post={post}
          onLike={handleLike}
          onSave={handleSave}
          onComment={handleComment}
        />
      ))}

      {hasMore && (
        <div className="max-w-[470px] mx-auto pt-4">
          <button
            onClick={() => fetchPosts(offset)}
            disabled={loading}
            className="w-full py-3 text-[#0095F6] font-semibold hover:text-[#004C8B] disabled:opacity-50"
          >
            {loading ? 'Caricamento...' : 'Carica altri post'}
          </button>
        </div>
      )}
    </div>
  );
}

