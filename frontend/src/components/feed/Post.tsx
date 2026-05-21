"use client";
/**
 * @fileoverview Componente Post del feed.
 *
 * Visualizza un singolo post con header, media, azioni e commenti.
 * 
 * FUNZIONALITÀ:
 * - Header con avatar, username e badge verifica
 * - Carosello media (immagini/video)
 * - Pulsanti azione: like, commenti, condividi, salva
 * - Animazione doppio tap per like
 * - Visualizzazione tag nelle immagini
 * - Conteggio like e commenti
 * - Input commento rapido
 * - Modal opzioni post
 * - Integrazione storie profilo
 * 
 * @module components/feed/Post
 */

import { useCallback, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import ProfilePicture from '@/components/ProfilePicture';
import { VerifiedBadge, MoreOptionsIcon, ShareIcon, TagIcon } from '@/components/common';
import {ProfilePreviewCard} from '@/components/profile';
import {PostOptionsModal, DeletePostModal}  from '@/components/feed';
import { formatTimeAgo } from '@/lib/date-utils';
import { getMediaUrl } from '@/lib/media';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { toggleFollowAction } from '@/features/follow';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import type { FeedPost } from '@/types/feed';
import PostModal from './PostModal';
import StoryViewer from './StoryViewer';
import { fetchPostTagsAction } from '@/features/posts';

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
  const [hasViewedAllStories, setHasViewedAllStories] = useState(post.profile_has_viewed_story);
  const [tags, setTags] = useState<Array<{taggedUsername: string; x_position: number; y_position: number}>>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [hoveredUsername, setHoveredUsername] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);
  const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  const loadTagsIfNeeded = useCallback(async () => {
    if (tagsLoaded || isLoadingTags) return;

    setIsLoadingTags(true);
    try {
      const result = await fetchPostTagsAction(post.id);
      if (result.success) {
        // Manteniamo un'unica cache locale dei tag, condivisa tra card e modal.
        const transformedTags = result.data.map(tag => ({
          taggedUsername: tag.taggedUsername,
          x_position: tag.xPosition,
          y_position: tag.yPosition,
        }));
        setTags(transformedTags);
        setTagsLoaded(true);
      } else {
        console.error('Failed to load tags:', result.error);
      }
    } catch (err) {
      console.error('Failed to load tags:', err);
    } finally {
      setIsLoadingTags(false);
    }
  }, [isLoadingTags, post.id, tagsLoaded]);

  const handleToggleTags = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (showTags) {
      setShowTags(false);
      return;
    }

    await loadTagsIfNeeded();

    setShowTags(true);
  };

  const handleOpenModal = async () => {
    await loadTagsIfNeeded();
    setIsModalOpen(true);
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    await onComment(post.id, commentText);
    setCommentText('');
    setIsSubmitting(false);
  };

  const handleLike = () => {
    // Mostra sempre animazione cuore esplosivo al doppio click
    setShowExplodingHeart(true);
    setTimeout(() => setShowExplodingHeart(false), 1000);

    // Aggiungi like solo se non è già stato messo
    if (!post.is_liked_by_current_user) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
      onLike(post.id);
    }
  };

  const handleButtonLike = () => {
    // Il click sul pulsante può attivare/disattivare il like
    if (!post.is_liked_by_current_user) {
      setShowExplodingHeart(true);
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
    }
    onLike(post.id);
  };

  const handleFollow = async () => {
    if (isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      const result = await toggleFollowAction({ targetProfileId: post.profile_id });
      if (result.success && result.data) {
        if (result.data.action === 'requested') {
          setIsPending(true);
          setIsFollowing(false);
        } else if (result.data.action === 'created') {
          setIsFollowing(true);
          setIsPending(false);
        } else if (result.data.action === 'removed') {
          // Annullamento richiesta pendente
          setIsPending(false);
          setIsFollowing(false);
        }
      } else if (!result.success) {
        console.error('[Post] toggleFollow failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleUnfollow = () => {
    setShowUnfollowModal(true);
  };

  const confirmUnfollow = async () => {
    if (isFollowLoading) return;

    setIsFollowLoading(true);
    setShowUnfollowModal(false);
    try {
      const result = await toggleFollowAction({ targetProfileId: post.profile_id });
      if (result.success && result.data?.action === 'removed') {
        setIsFollowing(false);
        setIsPending(false);
      } else if (!result.success) {
        console.error('[Post] toggleUnfollow failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
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

  // Gestione eliminazione post
  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      // Chiudi tutti i modali e ricarica la pagina
      setShowDeletePostModal(false);
      setShowPostOptionsModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Impossibile eliminare il post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  const isOwnPost = currentProfile && post.profile_id === currentProfile.id;

  return (
    <article className="mb-3">
      {/* Post Header */}
      <div className="flex items-center justify-between px-4 py-3 max-[639px]:px-2">
        <div className="flex items-center gap-2">
          <ProfilePicture
            src={post.profile_image_url}
            alt={post.profile_username || 'Profile picture'}
            size={40}
            hasStory={post.profile_has_active_story && !hasViewedAllStories}
            storyViewed={hasViewedAllStories}
            username={post.profile_username}
            onStoryClick={post.profile_has_active_story && !hasViewedAllStories ? () => setShowStoryViewer(true) : undefined}
          />
          <div className="flex items-center gap-1 relative">
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
          {currentProfile && post.profile_id !== currentProfile.id && (
            <button
              onClick={isFollowing ? handleUnfollow : handleFollow}
              disabled={isFollowLoading}
              className={`text-sm font-semibold text-follow hover:underline disabled:opacity-50`}
            >
              {isFollowLoading ? '...' : isFollowing ? 'Segui già' : isPending ? 'Richiesta inviata' : 'Segui'}
            </button>
          )}
          <button 
            type="button" 
            className="hover:scale-110 transition-transform"
            onClick={() => isOwnPost && setShowPostOptionsModal(true)}
          >
            <MoreOptionsIcon size={24} />
          </button>
        </div>
      </div>

      {/* Post Media */}
      {post.media.length > 0 && (
        <div
          className="relative w-full aspect-[3/4] rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden mb-2"
          onDoubleClick={handleLike}
        >
          {post.media[0].media_type === 'video' ? (
            <div className="relative w-full h-full">
              <video
                ref={(el) => {
                  if (el) {
                    el.muted = isMuted;
                    if (isPlaying) {
                      el.play().catch(() => {});
                    } else {
                      el.pause();
                    }
                  }
                }}
                src={getMediaUrl(post.media[0].media_url) ?? ''}
                className="w-full h-full object-cover rounded-xl cursor-pointer"
                autoPlay
                loop
                muted
                playsInline
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget;
                  if (video.paused) {
                    video.play();
                    setIsPlaying(true);
                  } else {
                    video.pause();
                    setIsPlaying(false);
                  }
                }}
              />
              {/* Icona play quando in pausa */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Play className="w-16 h-16 text-white fill-white" />
                </div>
              )}
              {/* Pulsante Muto/Non Muto */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="absolute bottom-3 right-3 z-10 w-7 h-7 bg-transparent hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                aria-label={isMuted ? 'Attiva audio' : 'Disattiva audio'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-white drop-shadow-lg" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white drop-shadow-lg" />
                )}
              </button>
            </div>
          ) : (
            <Image
              src={getMediaUrl(post.media[0].media_url) ?? ''}
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
          
          {/* Icona Tag: visibile se il backend segnala tag presenti, fallback lazy su payload legacy */}
          {(post.has_tags ?? (!tagsLoaded || tags.length > 0)) && (
            <button
              onClick={handleToggleTags}
              className="absolute bottom-3 left-3 w-7 h-7 flex items-center justify-center bg-black/60 rounded-full"
              aria-label="Mostra tag"
            >
              <TagIcon size={12} className="text-white" />
            </button>
          )}

          {/* Overlay Tag */}
          {showTags && tags.map((tag, index) => (
            <div
              key={index}
              className="absolute bg-black/80 text-white text-xs px-2 py-1 rounded-md pointer-events-none"
              style={{
                left: `${tag.x_position * 100}%`,
                top: `${tag.y_position * 100}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {tag.taggedUsername}
            </div>
          ))}
        </div>
      )}

      {/* Azioni Post */}
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
              onClick={handleOpenModal}
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
          onAllStoriesViewed={() => setHasViewedAllStories(true)}
        />
      )}

      {/* Post Modal */}
      <PostModal
        post={post}
        postTags={tags}
        onRequestPostTags={loadTagsIfNeeded}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onLike={onLike}
        onSave={onSave}
        onComment={onComment}
      />

      {/* Modale di conferma per smettere di seguire */}
      {showUnfollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 dark:bg-[rgba(12,16,20,0.75)]"
            onClick={() => setShowUnfollowModal(false)}
          />
          
          <div 
            className="relative bg-white dark:bg-[#262626] rounded-xl w-full max-w-[500px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center p-8 pb-4">
              <ProfilePicture
                src={post.profile_image_url}
                alt={post.profile_username || 'Profile picture'}
                size={90}
                hasStory={false}
              />
              <p className="text-sm text-[#262626] dark:text-[#FAFAFA] mt-6 mb-6 text-center">
                Non vuoi seguire più @{post.profile_username}?
              </p>
            </div>
            <div className="border-t border-gray-300 dark:border-[#363636]">
              <button
                onClick={confirmUnfollow}
                disabled={isFollowLoading}
                className="w-full py-3 text-sm font-bold text-[#ED4956] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isFollowLoading ? '...' : 'Non seguire più'}
              </button>
            </div>
            <div className="border-t border-gray-300 dark:border-[#363636]">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="w-full py-3 text-sm text-[#262626] dark:text-[#FAFAFA] transition-colors cursor-pointer"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale Opzioni Post */}
      {isOwnPost && (
        <PostOptionsModal
          isOpen={showPostOptionsModal}
          onClose={() => setShowPostOptionsModal(false)}
          onEdit={() => {
            // TODO: Implementare modifica post
            console.log('Edit post');
          }}
          onDelete={() => {
            setShowPostOptionsModal(false);
            setShowDeletePostModal(true);
          }}
          canEdit={true}
        />
      )}

      {/* Modale di conferma eliminazione post */}
      <DeletePostModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleDeletePost}
        isDeleting={isDeletingPost}
      />
    </article>
  );
}
