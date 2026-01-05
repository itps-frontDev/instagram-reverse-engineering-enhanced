/**
 * @fileoverview Post detail page
 * Shows a single post with comments
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Post from '@/components/feed/Post';
import type { FeedPost } from '@/lib/types/feed';

interface PostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

export default function PostPage({ params }: PostPageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/posts/${postId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Post non trovato');
          } else {
            setError('Errore nel caricamento del post');
          }
          return;
        }

        const data = await response.json();
        setPost(data.post);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Errore nel caricamento del post');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-gray-500">{error || 'Post non trovato'}</p>
        <button
          onClick={() => router.push('/')}
          className="text-blue-500 hover:text-blue-600 font-semibold"
        >
          Torna alla home
        </button>
      </div>
    );
  }

  const handleLike = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId: number) => {
    try {
      const response = await fetch(`/api/posts/${postId}/save`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleComment = async (postId: number, text: string) => {
    try {
      const response = await fetch(`/api/feed/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ postId, text }),
      });
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch (error) {
      console.error('Error commenting:', error);
    }
  };

  return (
    <div className="max-w-[630px] mx-auto pt-8 pb-16">
      <Post
        post={post}
        onLike={handleLike}
        onSave={handleSave}
        onComment={handleComment}
      />
    </div>
  );
}
