/**
 * @fileoverview Post component for feed
 *
 * Displays a single post with header, media, actions, and comments.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import type { FeedPost } from '@/lib/types/feed';

interface PostProps {
  post: FeedPost;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
}

export default function Post({ post, onLike, onSave, onComment }: PostProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onComment(post.id, commentText);
    setCommentText('');
    setIsSubmitting(false);
  };

  const formatLikesCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}g`;
    return `${Math.floor(seconds / 604800)}sett`;
  };

  return (
    <article className="bg-white dark:bg-black border border-[#DBDBDB] dark:border-[#262626] mb-3 max-w-[470px] mx-auto">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/profile/${post.profile_username}`}>
            {post.profile_image_url ? (
              <Image
                src={post.profile_image_url}
                alt={post.profile_username}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.profile_username}`}
              className="font-semibold text-sm text-[#262626] dark:text-[#FAFAFA] hover:opacity-50"
            >
              {post.profile_username}
            </Link>
            {post.profile_is_verified && (
              <svg
                className="w-3.5 h-3.5 text-blue-500"
                viewBox="0 0 40 40"
                fill="currentColor"
              >
                <path d="M19.998 3.094l2.124 3.217a3 3 0 0 0 2.135 1.313l3.85.557a3 3 0 0 1 1.657 5.117l-2.786 2.721a3 3 0 0 0-.862 2.656l.658 3.834a3 3 0 0 1-4.354 3.162l-3.446-1.813a3 3 0 0 0-2.788 0l-3.446 1.813a3 3 0 0 1-4.354-3.162l.658-3.834a3 3 0 0 0-.862-2.656L4.395 13.3a3 3 0 0 1 1.657-5.117l3.85-.557a3 3 0 0 0 2.135-1.313L14.158 3.1a3 3 0 0 1 5.84-.007z" />
              </svg>
            )}
            <span className="text-[#8E8E8E] dark:text-[#A8A8A8] text-sm">
              • {formatTimeAgo(post.created_at)}
            </span>
          </div>
        </div>
        <button className="text-[#262626] dark:text-[#FAFAFA]">
          <MoreHorizontal className="w-6 h-6" />
        </button>
      </div>

      {/* Post Media */}
      {post.media.length > 0 && (
        <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800">
          <Image
            src={post.media[0].media_url}
            alt={post.caption || 'Post image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-1 pb-2">
          <div className="flex items-center gap-4">
            <button onClick={() => onLike(post.id)} className="hover:opacity-50 transition-opacity">
              <Heart
                className={`w-6 h-6 ${
                  post.is_liked_by_current_user
                    ? 'fill-[#ED4956] text-[#ED4956]'
                    : 'text-[#262626] dark:text-[#FAFAFA]'
                }`}
              />
            </button>
            <button className="hover:opacity-50 transition-opacity">
              <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]" />
            </button>
            <button className="hover:opacity-50 transition-opacity">
              <Send className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]" />
            </button>
          </div>
          <button onClick={() => onSave(post.id)} className="hover:opacity-50 transition-opacity">
            <Bookmark
              className={`w-6 h-6 ${
                post.is_saved_by_current_user
                  ? 'fill-[#262626] dark:fill-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
                  : 'text-[#262626] dark:text-[#FAFAFA]'
              }`}
            />
          </button>
        </div>

        {/* Likes Count */}
        {!post.is_likes_hidden && post.likes_count > 0 && (
          <p className="font-semibold text-sm mb-2 text-[#262626] dark:text-[#FAFAFA]">
            {formatLikesCount(post.likes_count)} Mi piace
          </p>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="text-sm mb-1 text-[#262626] dark:text-[#FAFAFA]">
            <Link
              href={`/profile/${post.profile_username}`}
              className="font-semibold mr-2 hover:opacity-50"
            >
              {post.profile_username}
            </Link>
            <span>{post.caption}</span>
          </div>
        )}

        {/* View Comments */}
        {post.comments_count > 0 && (
          <button className="text-sm text-[#8E8E8E] dark:text-[#A8A8A8] mb-1 hover:opacity-50">
            Visualizza tutti i {post.comments_count} commenti
          </button>
        )}

        {/* Add Comment */}
        {!post.is_comments_disabled && (
          <div className="flex items-center gap-2 pt-2 mt-2 border-t border-[#EFEFEF] dark:border-[#262626]">
            <input
              type="text"
              placeholder="Aggiungi un commento..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCommentSubmit();
                }
              }}
              disabled={isSubmitting}
              className="flex-1 text-sm outline-none bg-transparent text-[#262626] dark:text-[#FAFAFA] placeholder:text-[#8E8E8E] dark:placeholder:text-[#A8A8A8] disabled:opacity-50"
            />
            {commentText.trim() && (
              <button
                onClick={handleCommentSubmit}
                disabled={isSubmitting}
                className="text-[#0095F6] font-semibold text-sm hover:text-[#004C8B] disabled:opacity-50"
              >
                Pubblica
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
