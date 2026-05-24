/**
 * @fileoverview Pagina Dettaglio Post - Visualizzazione singolo post
 *
 * Route: /p/[postId]
 */

'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Post from '@/components/feed/Post';
import { LoadingSpinner } from '@/components/common';
import type { FeedPost } from '@/types/feed';
import type { PostDetailDTO } from '@/features/posts';
import { getPostDetailAction, togglePostSaveAction } from '@/features/posts';
import { createCommentAction } from '@/features/comments';
import { toggleLikeAction } from '@/features/likes';

interface PostPageProps {
  params: Promise<{
    postId: string;
  }>;
}

function mapPostDetailToFeedPost(post: PostDetailDTO): FeedPost {
  return {
    id: post.id,
    profile_id: post.profileId,
    caption: post.caption || null,
    location: null,
    is_comments_disabled: false,
    is_likes_hidden: false,
    likes_count: post.likesCount,
    comments_count: post.commentsCount,
    created_at: post.createdAt,
    profile_username: post.profileUsername,
    profile_full_name: post.profileFullName,
    profile_image_url: post.profileImageUrl,
    profile_is_verified: post.profileIsVerified,
    profile_has_active_story: post.profileHasActiveStory,
    profile_has_viewed_story: post.profileHasViewedStory,
    profile_is_private: post.profileIsPrivate,
    media: post.media.map((m, index) => ({
      id: index,
      post_id: post.id,
      media_url: m.mediaUrl,
      media_type: m.mediaType,
      duration_seconds: m.durationSeconds ?? null,
      position: m.position,
    })),
    is_liked_by_current_user: post.isLikedByCurrentUser,
    is_saved_by_current_user: post.isSavedByCurrentUser,
    is_following_author: post.isFollowingAuthor,
    has_tags: post.hasTags,
  };
}

export default function PostPage({ params }: PostPageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLikeUpdating, setIsLikeUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      const parsedPostId = Number(postId);
      if (!Number.isInteger(parsedPostId) || parsedPostId <= 0) {
        setError('Post non trovato');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await getPostDetailAction({ postId: parsedPostId });
        if (!result.success) {
          setError(result.error ?? 'Errore nel caricamento del post');
          return;
        }
        setPost(mapPostDetailToFeedPost(result.data));
      } catch {
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
        <LoadingSpinner size={48} />
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

  const handleLike = async (targetPostId: number) => {
    if (isLikeUpdating) return;

    setIsLikeUpdating(true);
    try {
      const result = await toggleLikeAction({ likeableType: 'post', likeableId: targetPostId });
      if (result.success) {
        setPost((prev) =>
          prev
            ? { ...prev, is_liked_by_current_user: result.data.liked, likes_count: result.data.count }
            : prev
        );
      }
    } finally {
      setIsLikeUpdating(false);
    }
  };

  const handleSave = async (targetPostId: number) => {
    const result = await togglePostSaveAction({ postId: targetPostId });
    if (!result.success) return;
    setPost((prev) => (prev ? { ...prev, is_saved_by_current_user: result.data.saved } : prev));
  };

  const handleComment = async (targetPostId: number, text: string) => {
    const result = await createCommentAction({ postId: targetPostId, text });
    if (!result.success) return;
    setPost((prev) => (prev ? { ...prev, comments_count: prev.comments_count + 1 } : prev));
  };

  return (
    <div className="max-w-[630px] mx-auto pt-8 pb-16">
      <Post post={post} onLike={handleLike} onSave={handleSave} onComment={handleComment} />
    </div>
  );
}
