/**
 * @fileoverview Post modal component
 *
 * Displays a post in a modal with all comments and ability to comment.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProfilePicture from '@/components/ProfilePicture';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { FeedPost, Comment } from '@/lib/types/feed';

interface PostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
}

export default function PostModal({
  post,
  isOpen,
  onClose,
  onLike,
  onSave,
  onComment,
}: PostModalProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button - Outside modal */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-[60] text-white hover:opacity-70 transition-opacity bg-black/50 rounded-full p-2"
      >
        <X className="w-8 h-8" />
      </button>

      <div
        className="relative bg-[#212328] rounded-lg max-w-7xl w-full h-[86vh] flex overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Left Side - Image */}
        <div className="flex-1 bg-black flex items-center justify-center relative">
          {post.media.length > 0 && (
            <Image
              src={post.media[0].media_url}
              alt={post.caption || 'Post image'}
              fill
              className="object-contain"
              sizes="(max-width: 1200px) 50vw, 800px"
            />
          )}
        </div>

        {/* Right Side - Comments */}
        <div className="w-[400px] flex flex-col border-l border-gray-200 dark:border-[#262626]">
          {/* Post Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-3">
              <Link href={`/profile/${post.profile_username}`}>
                <ProfilePicture
                  src={post.profile_image_url}
                  alt={post.profile_username || 'Profile picture'}
                  size={32}
                />
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
              </div>
            </div>
            <button type="button" className="hover:opacity-50 transition-opacity">
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {/* Caption as first comment */}
            {post.caption && (
              <div className="flex gap-3 mb-4">
                <Link href={`/profile/${post.profile_username}`}>
                  <ProfilePicture
                    src={post.profile_image_url}
                    alt={post.profile_username || 'Profile picture'}
                    size={32}
                  />
                </Link>
                <div className="flex-1">
                  <div className="text-sm">
                    <Link
                      href={`/profile/${post.profile_username}`}
                      className="font-semibold text-[#262626] dark:text-[#FAFAFA] hover:opacity-50 mr-2"
                    >
                      {post.profile_username}
                    </Link>
                    <span className="text-[#262626] dark:text-[#FAFAFA]">
                      {post.caption}
                    </span>
                  </div>
                  <div className="text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-1">
                    {formatTimeAgo(post.created_at)}
                  </div>
                </div>
              </div>
            )}

            {/* Comments List */}
            {post.comments_count > 0 ? (
              <div className="text-center text-[#8E8E8E] dark:text-[#A8A8A8] text-sm py-8">
                Visualizza tutti i {post.comments_count} commenti
              </div>
            ) : (
              <div className="text-center text-[#8E8E8E] dark:text-[#A8A8A8] text-sm py-8">
                Nessun commento ancora
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-[#262626]">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => onLike(post.id)}
                  className="hover:opacity-50 transition-opacity"
                >
                  <Heart
                    className={`w-6 h-6 ${
                      post.is_liked_by_current_user
                        ? 'fill-[#ED4956] text-[#ED4956]'
                        : 'text-[#262626] dark:text-[#FAFAFA]'
                    }`}
                  />
                </button>
                <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]" />
                <button className="hover:opacity-50 transition-opacity">
                  <svg
                    className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => onSave(post.id)}
                className="hover:opacity-50 transition-opacity"
              >
                <Bookmark
                  className={`w-6 h-6 ${
                    post.is_saved_by_current_user
                      ? 'fill-[#262626] dark:fill-[#FAFAFA]'
                      : ''
                  } text-[#262626] dark:text-[#FAFAFA]`}
                />
              </button>
            </div>

            {/* Likes Count */}
            {!post.is_likes_hidden && post.likes_count > 0 && (
              <div className="text-sm font-semibold text-[#262626] dark:text-[#FAFAFA] pb-2">
                {formatLikesCount(post.likes_count)} Mi piace
              </div>
            )}

            {/* Time */}
            <div className="text-[10px] text-[#8E8E8E] dark:text-[#A8A8A8] uppercase pb-3">
              {formatTimeAgo(post.created_at)} fa
            </div>
          </div>

          {/* Comment Input */}
          <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626]">
            <div className="flex items-center gap-2">
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
                className="flex-1 bg-transparent text-sm text-[#262626] dark:text-[#FAFAFA] placeholder-[#8E8E8E] dark:placeholder-[#A8A8A8] outline-none"
                disabled={isSubmitting}
              />
              {commentText.trim() && (
                <button
                  onClick={handleCommentSubmit}
                  disabled={isSubmitting}
                  className="text-[#0095f6] font-semibold text-sm hover:opacity-70 disabled:opacity-50"
                >
                  {isSubmitting ? 'Invio...' : 'Pubblica'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

