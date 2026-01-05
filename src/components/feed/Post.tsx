/**
 * @fileoverview Post component for feed
 *
 * Displays a single post with header, media, actions, and comments.
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import MoreOptionsIcon from '@/components/common/MoreOptionsIcon';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from 'lucide-react';
import type { FeedPost } from '@/lib/types/feed';
import PostModal from './PostModal';

interface PostProps {
  post: FeedPost;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
}

export default function Post({ post, onLike, onSave, onComment }: PostProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showExplodingHeart, setShowExplodingHeart] = useState(false);

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onComment(post.id, commentText);
    setCommentText('');
    setIsSubmitting(false);
  };

  const handleLike = () => {
    // Always show the exploding heart animation on double-click
    setShowExplodingHeart(true);
    setTimeout(() => setShowExplodingHeart(false), 1000);

    // Only add like if not already liked (don't remove on double-click)
    if (!post.is_liked_by_current_user) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
      onLike(post.id);
    }
  };

  const handleButtonLike = () => {
    // Button click can toggle like on/off
    if (!post.is_liked_by_current_user) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
    }
    onLike(post.id);
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
    <article className="mb-3">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3">
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
            {post.profile_is_verified && <VerifiedBadge size={12} />}
            <span className="text-[#8E8E8E] dark:text-[#A8A8A8] text-sm">
              • {formatTimeAgo(post.created_at)}
            </span>
          </div>
        </div>
        <button type="button" className="hover:scale-110 transition-transform">
          <MoreOptionsIcon size={24} />
        </button>
      </div>

      {/* Post Media */}
      {post.media.length > 0 && (
        <div
          className="relative w-full aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden mt-2 mb-2"
          onDoubleClick={handleLike}
        >
          {post.media[0].media_type === 'video' ? (
            <video
              src={post.media[0].media_url}
              className="w-full h-full object-cover rounded-xl"
              controls
              muted
              playsInline
            />
          ) : (
            <Image
              src={post.media[0].media_url}
              alt={post.caption || 'Post image'}
              fill
              className="object-cover rounded-xl"
              sizes="(max-width: 768px) 100vw, 600px"
            />
          )}
          {/* Exploding Heart Animation */}
          {showExplodingHeart && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <Heart
                className="absolute top-1/2 left-1/2 w-24 h-24 fill-[#ED4956] text-[#ED4956] like-explode-animation"
                style={{ filter: 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.3))' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-1 pb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleButtonLike} className="flex items-center gap-1">
              <Heart
                className={`w-6 h-6 hover:scale-110 transition-transform ${
                  post.is_liked_by_current_user
                    ? 'fill-[#ED4956] text-[#ED4956]'
                    : 'text-[#262626] dark:text-[#FAFAFA]'
                } ${isLikeAnimating ? 'like-animation' : ''}`}
              />
              {!post.is_likes_hidden && post.likes_count > 0 && (
                <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA] ml-1">{formatLikesCount(post.likes_count)}</span>
              )}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1"
            >
              <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] hover:scale-110 transition-transform" />
              {post.comments_count > 0 && (
                <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA] ml-1">{post.comments_count}</span>
              )}
            </button>
            <button>
              <svg
                className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] hover:scale-110 transition-transform"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: 'rotate(13deg)' }}
              >
                <path d="M21.5 2.5Q16 8 11 13"/>
                <path d="M21.5 2.5Q18 12 15.5 20Q15 21.5 14 21Q12.5 17 11 13Q7 11.5 3 10Q2 9 2.5 8.5Q11 5.5 21.5 2.5Z"/>
              </svg>
            </button>
          </div>
          <button onClick={() => onSave(post.id)}>
            <Bookmark
              className={`w-6 h-6 hover:scale-110 transition-transform ${
                post.is_saved_by_current_user
                  ? 'fill-[#262626] dark:fill-[#FAFAFA] text-[#262626] dark:text-[#FAFAFA]'
                  : 'text-[#262626] dark:text-[#FAFAFA]'
              }`}
            />
          </button>
        </div>

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

      </div>

      {/* Post Modal */}
      <PostModal
        post={post}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLike={onLike}
        onSave={onSave}
        onComment={onComment}
      />
    </article>
  );
}

