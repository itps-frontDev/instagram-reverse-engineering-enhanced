/**
 * @fileoverview Post component for feed
 *
 * Displays a single post with header, media, actions, and comments.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import MoreOptionsIcon from '@/components/common/MoreOptionsIcon';
import ShareIcon from '@/components/common/ShareIcon';
import TagIcon from '@/components/common/TagIcon';
import ProfilePreviewCard from '@/components/profile/ProfilePreviewCard';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
} from 'lucide-react';
import type { FeedPost } from '@/lib/types/feed';
import PostModal from './PostModal';
import StoryViewer from './StoryViewer';

interface PostProps {
  post: FeedPost;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
}

export default function Post({ post, onLike, onSave, onComment }: PostProps) {
  const { profile: currentProfile } = useAuth();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showExplodingHeart, setShowExplodingHeart] = useState(false);
  const [showTags, setShowTags] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.is_following_author);
  const [isPending, setIsPending] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [tags, setTags] = useState<Array<{id: number; tagged_username: string; x_position: number; y_position: number}>>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [hoveredUsername, setHoveredUsername] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch(`/api/posts/${post.id}/tags`)
      .then(res => res.json())
      .then(data => {
        setTags(data.tags || []);
        setTagsLoaded(true);
      })
      .catch(err => console.error('Failed to load tags:', err));
  }, [post.id]);

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

  const handleFollow = async () => {
    if (isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const response = await fetch('/api/profiles/actions/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetProfileId: post.profile_id }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'pending') {
          setIsPending(true);
        } else {
          setIsFollowing(true);
        }
      }
    } catch (error) {
      console.error('Failed to follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
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
      <div className="flex items-center justify-between px-4 py-3 max-[639px]:px-2">
        <div className="flex items-center gap-3">
          <ProfilePicture
            src={post.profile_image_url}
            alt={post.profile_username || 'Profile picture'}
            size={32}
            hasStory={post.profile_has_active_story}
            username={post.profile_username}
            onStoryClick={post.profile_has_active_story ? () => setShowStoryViewer(true) : undefined}
          />
          <div className="flex items-center gap-2 relative">
            <Link
              href={`/profile/${post.profile_username}`}
              className="font-semibold text-sm text-[#262626] dark:text-[#FAFAFA] max-[639px]:text-xs max-[639px]:truncate max-[639px]:max-w-[120px]"
              onMouseEnter={() => {
                const timeout = setTimeout(() => {
                  setHoveredUsername(true);
                }, 500);
                setHoverTimeout(timeout);
              }}
              onMouseLeave={() => {
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                setHoveredUsername(false);
              }}
            >
              {post.profile_username}
            </Link>
            {hoveredUsername && (
              <div 
                className="absolute top-full left-0 mt-2 z-50"
                onMouseEnter={() => {
                  if (hoverTimeout) {
                    clearTimeout(hoverTimeout);
                    setHoverTimeout(null);
                  }
                }}
                onMouseLeave={() => {
                  setHoveredUsername(false);
                }}
              >
                <ProfilePreviewCard username={post.profile_username} />
              </div>
            )}
            {post.profile_is_verified && <VerifiedBadge size={12} />}
            <span className="text-[#8E8E8E] dark:text-[#A8A8A8] text-sm max-[639px]:text-xs">
              • {formatTimeAgo(post.created_at)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isFollowing && !isPending && currentProfile && post.profile_id !== currentProfile.id && (
            <button 
              onClick={handleFollow}
              disabled={isFollowLoading}
              className="text-sm font-semibold text-follow hover:underline disabled:opacity-50"
            >
              {isFollowLoading ? '...' : 'Segui'}
            </button>
          )}
          {isPending && (
            <button 
              disabled
              className="text-sm font-semibold text-[#84a0fe] dark:text-white opacity-70"
            >
              Richiesta effettuata
            </button>
          )}
          <button type="button" className="hover:scale-110 transition-transform">
            <MoreOptionsIcon size={24} />
          </button>
        </div>
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
          
          {/* Tag Icon - Bottom Left - Only show if there are tags */}
          {tagsLoaded && tags.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTags(!showTags);
              }}
              className="absolute bottom-3 left-3 w-7 h-7 flex items-center justify-center bg-black/60 rounded-full"
              aria-label="Mostra tag"
            >
              <TagIcon size={12} className="text-white" />
            </button>
          )}

          {/* Tags Overlay */}
          {showTags && tags.map((tag) => (
            <div
              key={tag.id}
              className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded-md pointer-events-none"
              style={{
                left: `${tag.x_position * 100}%`,
                top: `${tag.y_position * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {tag.tagged_username}
            </div>
          ))}
        </div>
      )}

      {/* Post Actions */}
      <div className="px-4 pb-4 max-[639px]:px-2">
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
              <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] icon-mirrored" />
              {post.comments_count > 0 && (
                <span className="text-xs font-semibold text-[#262626] dark:text-[#FAFAFA] ml-1">{post.comments_count}</span>
              )}
            </button>
            <button>
              <ShareIcon className="text-[#262626] dark:text-[#FAFAFA] hover:scale-110 transition-transform" />
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

      {/* Story Viewer */}
      {showStoryViewer && post.profile_username && (
        <StoryViewer
          profileUsername={post.profile_username}
          onClose={() => setShowStoryViewer(false)}
        />
      )}

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

