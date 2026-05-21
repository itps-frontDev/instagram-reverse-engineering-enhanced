/**
 * @fileoverview Modal visualizzazione post.
 *
 * Mostra un post in modal con tutti i commenti e possibilità di interagire.
 * 
 * FUNZIONALITÀ:
 * - Vista dettagliata post con media a sinistra
 * - Thread commenti con risposte annidate
 * - Like su commenti e risposte
 * - Eliminazione commenti propri
 * - Navigazione tra post (Esplora)
 * - Gestione tag e menzioni
 * - Modal opzioni e modifica post
 * - Integrazione storie autore
 * 
 * @module components/feed/PostModal
 */

'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import {ProfilePicture} from '@/components';
import { VerifiedBadge, ShareIcon, TagIcon } from '@/components/common';
import {StoryViewer, PostOptionsModal, DeletePostModal, EditPostModal} from '@/components/feed';
import ProfilePreviewCard from '@/components/profile/ProfilePreviewCard';
import { formatTimeAgo } from '@/lib/date-utils';
import { getMediaUrl } from '@/lib/media';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
  Volume2,
  VolumeX,
  Play,
} from 'lucide-react';
import type { FeedPost, Comment } from '@/types/feed';
import { createCommentAction, deleteCommentAction, listCommentsAction } from '@/features/comments';
import { toggleLikeAction } from '@/features/likes';
import { fetchPostTagsAction } from '@/features/posts';

interface PostModalProps {
  post: FeedPost;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
  // Optional navigation for Explore
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function PostModal({
  post,
  isOpen,
  onClose,
  onLike,
  onSave,
  onComment,
  onNext,
  onPrev,
  hasNext,
  hasPrev,
}: PostModalProps) {
  const { profile: currentProfile } = useAuth();
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [isFollowing, setIsFollowing] = useState(post.is_following_author);
  const [isPending, setIsPending] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [hoveredCommentId, setHoveredCommentId] = useState<number | null>(null);
  const [tags, setTags] = useState<Array<{taggedUsername: string; x_position: number; y_position: number}>>([]);
  const [tagsLoaded, setTagsLoaded] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerUsername, setStoryViewerUsername] = useState<string | null>(null);
  const [storyViewerProfileId, setStoryViewerProfileId] = useState<number | null>(null);
  const [viewedAllStoriesProfileIds, setViewedAllStoriesProfileIds] = useState<Set<number>>(new Set());
  const [hoveredUsername, setHoveredUsername] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showPostOptionsModal, setShowPostOptionsModal] = useState(false);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [showCommentOptionsModal, setShowCommentOptionsModal] = useState<number | null>(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);

  // Inizializza lo stato con il profilo del post che ha già tutte le storie viste
  useEffect(() => {
    const initialViewedProfiles = new Set<number>();
    if (post.profile_has_viewed_story) {
      initialViewedProfiles.add(post.profile_id);
    }
    setViewedAllStoriesProfileIds(initialViewedProfiles);
  }, [post.profile_id, post.profile_has_viewed_story]);

  // Aggiungi i profili dei commenti che hanno già tutte le storie viste quando i commenti cambiano
  useEffect(() => {
    if (comments.length > 0) {
      setViewedAllStoriesProfileIds(prev => {
        const updated = new Set(prev);
        comments.forEach(comment => {
          if (comment.profile_has_viewed_story) {
            updated.add(comment.profile_id);
          }
        });
        return updated;
      });
    }
  }, [comments.length]); // Usa solo la lunghezza per evitare problemi con l'array

  useEffect(() => {
    if (isOpen) {
      const loadTags = async () => {
        try {
          const result = await fetchPostTagsAction(post.id);
          if (result.success) {
            // Trasforma PostTagDTO nel formato che il componente si aspetta
            const transformedTags = result.data.map(tag => ({
              taggedUsername: tag.taggedUsername,
              x_position: tag.xPosition,
              y_position: tag.yPosition,
            }));
            setTags(transformedTags);
          } else {
            console.error('Failed to load tags:', result.error);
          }
          setTagsLoaded(true);
        } catch (err) {
          console.error('Failed to load tags:', err);
          setTagsLoaded(true);
        }
      };

      loadTags();
    }
  }, [isOpen, post.id]);

  useEffect(() => {
    if (!isOpen) return;

    setCurrentMediaIndex(0);
    setShowStoryViewer(false);
    setStoryViewerUsername(null);
    fetchComments();
  }, [isOpen, post.id]);

  useEffect(() => {
    if (!isOpen) return;

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyWidth = body.style.width;
    const previousBodyTop = body.style.top;
    const previousBodyLeft = body.style.left;
    const previousBodyRight = body.style.right;
    const previousHtmlOverflow = html.style.overflow;

    // Blocca lo scroll della pagina dietro il modal su tutti i viewport.
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.width = '100%';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    html.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.width = previousBodyWidth;
      body.style.top = previousBodyTop;
      body.style.left = previousBodyLeft;
      body.style.right = previousBodyRight;
      html.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen || (!onNext && !onPrev)) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev]);

  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      const result = await listCommentsAction({ postId: post.id, limit: 50, offset: 0 });
      if (!result.success) throw new Error(result.error);
      
      setComments(result.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const body: { postId: number; text: string; parentId?: number } = { 
        postId: post.id, 
        text: commentText 
      };
      
      // Aggiungere parentId se si sta rispondendo a un commento
      if (replyingTo) {
        body.parentId = replyingTo.id;
      }

      const result = await createCommentAction(body);
      if (!result.success) throw new Error(result.error);
      
      // Aggiungere il nuovo commento in testa alla lista (solo commenti top-level)
      if (!replyingTo) {
        setComments([result.data, ...comments]);
      } else {
        // Per le risposte, ricaricare i commenti per mostrare l'update
        fetchComments();
      }
      
      // Reset
      setCommentText('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    const result = await toggleLikeAction({ likeableType: 'comment', likeableId: commentId });
    if (!result.success) {
      console.error('Failed to like comment:', result.error);
      return;
    }
    setComments((prevComments) =>
      prevComments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              is_liked_by_current_user: result.data.liked,
              likes_count: result.data.count,
            }
            : comment
        )
      );
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

  const formatLikesText = (count: number): string => {
    if (count === 0) return '';
    if (count === 1) return 'Piace a 1 persona';
    if (count < 1000) return `Piace a ${count} persone`;
    if (count < 1000000) return `Piace a ${(count / 1000).toFixed(1)}K persone`;
    return `Piace a ${(count / 1000000).toFixed(1)}M persone`;
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

  // Gestione eliminazione post
  const handleDeletePost = async () => {
    setIsDeletingPost(true);
    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete post');

      // Chiudi tutti i modali e torna alla pagina precedente
      setShowDeletePostModal(false);
      setShowPostOptionsModal(false);
      onClose();
      
      // Ricarica la pagina per aggiornare la griglia
      window.location.reload();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Impossibile eliminare il post');
    } finally {
      setIsDeletingPost(false);
    }
  };

  // Gestione eliminazione commento
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setIsDeletingComment(true);
    try {
      const result = await deleteCommentAction({ commentId: commentToDelete.id });
      if (!result.success) throw new Error(result.error);

      // Rimuovi il commento dalla lista
      setComments(comments.filter(c => c.id !== commentToDelete.id && c.parent_id !== commentToDelete.id));
      
      // Chiudi i modali
      setShowDeleteModal(false);
      setCommentToDelete(null);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Impossibile eliminare il commento');
    } finally {
      setIsDeletingComment(false);
    }
  };

  const isOwnPost = currentProfile && post.profile_id === currentProfile.id;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 dark:bg-[rgba(12,16,20,0.75)]"
        onClick={() => {
          // Chiudi solo il post modal se NESSUN modale secondario è aperto
          if (!showDeleteModal && !showPostOptionsModal && !showDeletePostModal && !showEditPostModal) {
            onClose();
          }
        }}
      />

      {/* Close Button - Outside modal */}
      <button
        onClick={() => {
          if (!showDeleteModal && !showPostOptionsModal && !showDeletePostModal && !showEditPostModal) {
            onClose();
          }
        }}
        className="absolute top-6 right-6 z-[60] text-white hover:scale-105 transition-transform duration-150 rounded-full p-2"
      >
        <X className="w-7 h-7" />
      </button>

      {/* Navigation Arrows - Only in Explore */}
      {onPrev && hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-[60] bg-white hover:opacity-70 transition-opacity rounded-full p-1.5 shadow-lg"
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {onNext && hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-[60] bg-white hover:opacity-70 transition-opacity rounded-full p-1.5 shadow-lg"
        >
          <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <div
        className="relative bg-white dark:bg-[#212328] rounded-lg max-w-[70vw] w-full h-[96vh] flex overflow-hidden max-[639px]:max-w-[95vw] max-[639px]:flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Left Side - Media (Image or Video) */}
        <div className="flex-1 bg-gray-100 dark:bg-black flex items-center justify-center relative group/media max-[639px]:max-h-[50vh]">
          {post.media.length > 0 && post.media[currentMediaIndex] && (
            <>
              {post.media[currentMediaIndex].media_type === 'video' ? (
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
                    src={getMediaUrl(post.media[currentMediaIndex].media_url) ?? ''}
                    className="w-full h-full object-cover cursor-pointer"
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
                  {/* Icona Play quando in pausa */}
                  {!isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <Play className="w-16 h-16 text-white fill-white" />
                    </div>
                  )}
                  {/* Mute/Unmute Button */}
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
                  src={getMediaUrl(post.media[currentMediaIndex].media_url) ?? ''}
                  alt={post.caption || 'Post image'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 60vw, 1200px"
                />
              )}
            </>
          )}

          {/* Media Navigation Arrows */}
          {post.media.length > 1 && (
            <>
              {/* Previous Media Arrow */}
              {currentMediaIndex > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex(currentMediaIndex - 1);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white/70 rounded-full flex items-center justify-center transition-opacity hover:bg-white/80"
                  aria-label="Immagine precedente"
                >
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Next Media Arrow */}
              {currentMediaIndex < post.media.length - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentMediaIndex(currentMediaIndex + 1);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-6 h-6 bg-white/70 rounded-full flex items-center justify-center transition-opacity hover:bg-white/80"
                  aria-label="Immagine successiva"
                >
                  <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Media Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {post.media.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentMediaIndex
                        ? 'bg-white w-2'
                        : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              {/* Tag Icon - Bottom Left - Only show if there are tags */}
              {tagsLoaded && tags.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTags(!showTags);
                  }}
                  className="absolute bottom-4 left-4 w-7 h-7 flex items-center justify-center bg-black/60 rounded-full z-10"
                  aria-label="Mostra tag"
                >
                  <TagIcon size={12} className="text-white" />
                </button>
              )}

              {/* Tags Overlay */}
              {showTags && tags.map((tag, index) => (
                <div
                  key={index}
                  className="absolute bg-black/80 text-white text-sm px-3 py-1.5 rounded-md pointer-events-none z-10"
                  style={{
                    left: `${tag.x_position * 100}%`,
                    top: `${tag.y_position * 100}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  {tag.taggedUsername}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Right Side - Comments */}
        <div className="w-[480px] flex flex-col border-l border-gray-200 dark:border-[#262626] max-[639px]:w-full max-[639px]:border-l-0 max-[639px]:border-t">
          {/* Post Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-[#262626] max-[639px]:px-2">
            <div className="flex items-center gap-3">
              <ProfilePicture
                src={post.profile_image_url}
                alt={post.profile_username || 'Profile picture'}
                size={32}
                hasStory={post.profile_has_active_story && !viewedAllStoriesProfileIds.has(post.profile_id) && (!post.profile_is_private || isFollowing)}
                storyViewed={viewedAllStoriesProfileIds.has(post.profile_id)}
                username={post.profile_username}
                onStoryClick={() => {
                  if (post.profile_has_active_story && !viewedAllStoriesProfileIds.has(post.profile_id) && (!post.profile_is_private || isFollowing)) {
                    setStoryViewerUsername(post.profile_username);
                    setStoryViewerProfileId(post.profile_id);
                    setShowStoryViewer(true);
                  }
                }}
              />
              <div className="flex items-center gap-2 relative">
                <Link
                  href={`/profile/${post.profile_username}`}
                  className="font-semibold text-sm text-[#262626] dark:text-[#FAFAFA]"
                  onMouseEnter={() => {
                    const timeout = setTimeout(() => {
                      setHoveredUsername(post.profile_username);
                    }, 500);
                    setHoverTimeout(timeout);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      setHoverTimeout(null);
                    }
                    setHoveredUsername(null);
                  }}
                >
                  {post.profile_username}
                </Link>
                {hoveredUsername === post.profile_username && (
                  <div 
                    className="absolute top-full left-0 mt-2 z-50"
                    onMouseEnter={() => {
                      if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        setHoverTimeout(null);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredUsername(null);
                    }}
                  >
                    <ProfilePreviewCard username={post.profile_username} />
                  </div>
                )}
                {post.profile_is_verified && <VerifiedBadge size={14} />}
                {!isFollowing && !isPending && currentProfile && post.profile_id !== currentProfile.id && (
                  <>
                    <span className="text-[#737373] dark:text-[#737373]">•</span>
                    <button 
                      onClick={handleFollow}
                      disabled={isFollowLoading}
                      className="font-semibold text-sm hover:underline disabled:opacity-50"
                      style={{ color: 'rgb(112, 141, 255)' }}
                    >
                      {isFollowLoading ? '...' : 'Segui'}
                    </button>
                  </>
                )}
                {isPending && (
                  <>
                    <span className="text-[#737373] dark:text-[#737373]">•</span>
                    <button 
                      disabled
                      className="font-semibold text-sm opacity-70"
                      style={{ color: 'rgb(112, 141, 255)' }}
                    >
                      Richiesta effettuata
                    </button>
                  </>
                )}
              </div>
            </div>
            <button 
              type="button" 
              className="hover:opacity-50 transition-opacity"
              onClick={() => {
                if (isOwnPost) {
                  setShowPostOptionsModal(true);
                }
              }}
            >
              <MoreHorizontal className="w-6 h-6" />
            </button>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto px-4 py-4 max-[639px]:px-2">
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
                  <div className="text-sm relative">
                    <Link
                      href={`/profile/${post.profile_username}`}
                      className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-2 hover:underline"
                      onMouseEnter={() => {
                        const timeout = setTimeout(() => {
                          setHoveredUsername(`caption-${post.profile_username}`);
                        }, 500);
                        setHoverTimeout(timeout);
                      }}
                      onMouseLeave={() => {
                        if (hoverTimeout) {
                          clearTimeout(hoverTimeout);
                          setHoverTimeout(null);
                        }
                        setHoveredUsername(null);
                      }}
                    >
                      {post.profile_username}
                    </Link>
                    {hoveredUsername === `caption-${post.profile_username}` && (
                      <div 
                        className="absolute top-full left-0 mt-2 z-50"
                        onMouseEnter={() => {
                          if (hoverTimeout) {
                            clearTimeout(hoverTimeout);
                            setHoverTimeout(null);
                          }
                        }}
                        onMouseLeave={() => {
                          setHoveredUsername(null);
                        }}
                      >
                        <ProfilePreviewCard username={post.profile_username} />
                      </div>
                    )}
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
            {isLoadingComments ? (
              <div className="text-center text-[#8E8E8E] dark:text-[#A8A8A8] text-sm py-8">
                Caricamento commenti...
              </div>
            ) : comments.length > 0 ? (
              comments
                .filter((c) => !c.parent_id) // Solo commenti top-level
                .map((comment) => {
                  // Trova le risposte per questo commento
                  const replies = comments.filter((c) => c.parent_id === comment.id);
                  
                  return (
                    <React.Fragment key={comment.id}>
                      {/* Commento Principale */}
                      <div
                        key={comment.id}
                        className="flex gap-3 mb-4"
                        onMouseEnter={() => setHoveredCommentId(comment.id)}
                        onMouseLeave={() => setHoveredCommentId(null)}
                      >
                        <ProfilePicture
                          src={comment.profile_image_url}
                          alt={comment.profile_username || 'Profile picture'}
                          size={32}
                          hasStory={comment.profile_has_active_story && !viewedAllStoriesProfileIds.has(comment.profile_id) && (!comment.profile_is_private || isFollowing)}
                          storyViewed={viewedAllStoriesProfileIds.has(comment.profile_id)}
                          username={comment.profile_username}
                          onStoryClick={() => {
                            if (comment.profile_has_active_story && !viewedAllStoriesProfileIds.has(comment.profile_id) && (!comment.profile_is_private || isFollowing)) {
                              setStoryViewerUsername(comment.profile_username);
                              setStoryViewerProfileId(comment.profile_id);
                              setShowStoryViewer(true);
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm relative">
                            <Link
                              href={`/profile/${comment.profile_username}`}
                              className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-2 hover:underline"
                              onMouseEnter={() => {
                                const timeout = setTimeout(() => {
                                  setHoveredUsername(`comment-${comment.id}`);
                                }, 500);
                                setHoverTimeout(timeout);
                              }}
                              onMouseLeave={() => {
                                if (hoverTimeout) {
                                  clearTimeout(hoverTimeout);
                                  setHoverTimeout(null);
                                }
                                setHoveredUsername(null);
                              }}
                            >
                              {comment.profile_username}
                            </Link>
                            {hoveredUsername === `comment-${comment.id}` && (
                              <div 
                                className="absolute top-full left-0 mt-2 z-50"
                                onMouseEnter={() => {
                                  if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredUsername(null);
                                }}
                              >
                                <ProfilePreviewCard username={comment.profile_username} />
                              </div>
                            )}
                            {comment.profile_is_verified && <span className="-ml-1 mr-1 inline-block"><VerifiedBadge size={12} /></span>}
                            <span className="text-[#262626] dark:text-[#FAFAFA]">
                              {comment.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-1">
                            <span>{formatTimeAgo(comment.created_at)}</span>
                            {comment.likes_count > 0 && (
                              <span className="font-semibold">
                                {isOwnPost ? `Mi piace: ${comment.likes_count}` : (comment.likes_count === 1 ? 'Piace a 1 persona' : `Piace a ${comment.likes_count} persone`)}
                              </span>
                            )}
                            <button 
                              onClick={() => setReplyingTo(comment)}
                              className="font-semibold hover:opacity-50"
                            >
                              Rispondi
                            </button>
                            {/* Bottone 3 puntini per il proprietario del post o del commento, visibile solo su hover */}
                            {(() => {
                              const canDelete = isOwnPost || Number(currentProfile?.id) === comment.profile_id;
                              return canDelete ? (
                                <button
                                  className="ml-1 p-2 rounded-full transition-all hover:scale-110"
                                  onClick={() => { setCommentToDelete(comment); setShowDeleteModal(true); }}
                                  aria-label="Opzioni commento"
                                  style={{
                                    opacity: hoveredCommentId === comment.id ? 1 : 0,
                                    visibility: hoveredCommentId === comment.id ? 'visible' : 'hidden'
                                  }}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5 text-[#8E8E8E] dark:text-[#A8A8A8]" />
                                </button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCommentLike(comment.id)}
                          className="hover:opacity-50 transition-opacity self-start"
                        >
                          <Heart
                            className={`w-3 h-3 ${comment.is_liked_by_current_user ? 'fill-[#ED4956] text-[#ED4956]' : 'text-[#8E8E8E] dark:text-[#A8A8A8]'}`}
                          />
                        </button>
                      </div>
                
                {/* Risposte (nested) */}
                {replies.length > 0 && (
                  <div className="ml-11 mt-2 space-y-2">
                    {replies.map((reply) => (
                      <div key={reply.id} className="flex gap-3"
                        onMouseEnter={() => setHoveredCommentId(reply.id)}
                        onMouseLeave={() => setHoveredCommentId(null)}
                      >
                        <ProfilePicture
                          src={reply.profile_image_url}
                          alt={reply.profile_username || 'Profile picture'}
                          size={28}
                          hasStory={reply.profile_has_active_story && !viewedAllStoriesProfileIds.has(reply.profile_id) && (!reply.profile_is_private || isFollowing)}
                          storyViewed={viewedAllStoriesProfileIds.has(reply.profile_id)}
                          username={reply.profile_username}
                          onStoryClick={() => {
                            if (reply.profile_has_active_story && !viewedAllStoriesProfileIds.has(reply.profile_id) && (!reply.profile_is_private || isFollowing)) {
                              setStoryViewerUsername(reply.profile_username);
                              setStoryViewerProfileId(reply.profile_id);
                              setShowStoryViewer(true);
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm relative">
                            <Link
                              href={`/profile/${reply.profile_username}`}
                              className="font-semibold text-[#262626] dark:text-[#FAFAFA] mr-2 hover:underline"
                              onMouseEnter={() => {
                                const timeout = setTimeout(() => {
                                  setHoveredUsername(`reply-${reply.id}`);
                                }, 500);
                                setHoverTimeout(timeout);
                              }}
                              onMouseLeave={() => {
                                if (hoverTimeout) {
                                  clearTimeout(hoverTimeout);
                                  setHoverTimeout(null);
                                }
                                setHoveredUsername(null);
                              }}
                            >
                              {reply.profile_username}
                            </Link>
                            {hoveredUsername === `reply-${reply.id}` && (
                              <div 
                                className="absolute top-full left-0 mt-2 z-50"
                                onMouseEnter={() => {
                                  if (hoverTimeout) {
                                    clearTimeout(hoverTimeout);
                                    setHoverTimeout(null);
                                  }
                                }}
                                onMouseLeave={() => {
                                  setHoveredUsername(null);
                                }}
                              >
                                <ProfilePreviewCard username={reply.profile_username} />
                              </div>
                            )}
                            {reply.profile_is_verified && <span className="-ml-1 mr-1 inline-block"><VerifiedBadge size={12} /></span>}
                            <span className="text-[#262626] dark:text-[#FAFAFA]">
                              {reply.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-1">
                            <span>{formatTimeAgo(reply.created_at)}</span>
                            {reply.likes_count > 0 && (
                              <span className="font-semibold">
                                {isOwnPost ? `Mi piace: ${reply.likes_count}` : (reply.likes_count === 1 ? 'Piace a 1 persona' : `Piace a ${reply.likes_count} persone`)}
                              </span>
                            )}
                            <button 
                              onClick={() => setReplyingTo(comment)}
                              className="font-semibold hover:opacity-50"
                            >
                              Rispondi
                            </button>
                            {/* Bottone 3 puntini per il proprietario del post o della risposta, visibile solo su hover */}
                            {(() => {
                              const canDelete = isOwnPost || Number(currentProfile?.id) === reply.profile_id;
                              return canDelete ? (
                                <button
                                  className="ml-1 p-2 rounded-full transition-all hover:scale-110"
                                  onClick={() => { setCommentToDelete(reply); setShowDeleteModal(true); }}
                                  aria-label="Opzioni risposta"
                                  style={{
                                    opacity: hoveredCommentId === reply.id ? 1 : 0,
                                    visibility: hoveredCommentId === reply.id ? 'visible' : 'hidden'
                                  }}
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5 text-[#8E8E8E] dark:text-[#A8A8A8]" />
                                </button>
                              ) : null;
                            })()}

                          </div>
                        </div>
                        <button 
                          onClick={() => handleCommentLike(reply.id)}
                          className="hover:opacity-50 transition-opacity self-start"
                        >
                          <Heart
                            className={`w-3 h-3 ${reply.is_liked_by_current_user ? 'fill-[#ED4956] text-[#ED4956]' : 'text-[#8E8E8E] dark:text-[#A8A8A8]'}`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })
        ) : (
          <div className="text-center text-[#8E8E8E] dark:text-[#A8A8A8] text-sm py-8">
            Nessun commento ancora.
          </div>
        )}
      </div>

      {/* Actions Section */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626] max-[639px]:px-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(post.id)}
              className="hover:scale-103 transition-transform"
            >
              <Heart
                className={`w-6 h-6 ${
                  post.is_liked_by_current_user
                    ? 'fill-[#ED4956] text-[#ED4956]'
                    : 'text-[#262626] dark:text-[#FAFAFA]'
                }`}
              />
            </button>
            <button className="hover:scale-103 transition-transform cursor-pointer">
              <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] icon-mirrored" />
            </button>
            <button className="hover:scale-103 transition-transform">
              <ShareIcon className="text-[#262626] dark:text-[#FAFAFA]" />
            </button>
          </div>
          <button
            onClick={() => onSave(post.id)}
            className="hover:scale-103 transition-transform"
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
            {isOwnPost ? `Mi piace: ${post.likes_count}` : formatLikesText(post.likes_count)}
          </div>
        )}

        {/* Time */}
        <div className="text-[10px] text-[#8E8E8E] dark:text-[#A8A8A8] uppercase pb-3">
          {formatTimeAgo(post.created_at)} fa
        </div>
      </div>

      {/* Comment Input */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-[#262626] max-[639px]:px-2">
        {/* Replying To Indicator */}
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-[#8E8E8E] dark:text-[#A8A8A8]">
              Rispondendo a <span className="font-semibold text-[#262626] dark:text-[#FAFAFA]">@{replyingTo.profile_username}</span>
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-[#8E8E8E] dark:text-[#A8A8A8] hover:text-[#262626] dark:hover:text-[#FAFAFA]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
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
          <button
            onClick={handleCommentSubmit}
            disabled={isSubmitting || !commentText.trim()}
            className="font-semibold text-sm hover:opacity-70 disabled:opacity-30 transition-opacity text-[#8E8E8E] dark:text-[#A8A8A8]"
          >
            {isSubmitting ? 'Invio...' : 'Pubblica'}
          </button>
        </div>
      </div>

      {/* Post Options Modal */}
      <PostOptionsModal
        isOpen={showPostOptionsModal}
        onClose={() => setShowPostOptionsModal(false)}
        onEdit={() => {
          setShowPostOptionsModal(false);
          setShowEditPostModal(true);
        }}
        onDelete={() => {
          setShowPostOptionsModal(false);
          setShowDeletePostModal(true);
        }}
        canEdit={!!isOwnPost}
      />

      {/* Edit Post Modal */}
      {isOwnPost && (
        <EditPostModal
          isOpen={showEditPostModal}
          onClose={() => setShowEditPostModal(false)}
          postId={post.id}
          currentCaption={post.caption || ''}
          mediaUrl={getMediaUrl(post.media[0]?.media_url) ?? ''}
          mediaType={post.media[0]?.media_type || 'image'}
          onSave={(newCaption) => {
            // Aggiorna la caption localmente
            post.caption = newCaption;
            setShowEditPostModal(false);
          }}
        />
      )}

      {/* Delete Post Confirmation Modal */}
      <DeletePostModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={handleDeletePost}
        isDeleting={isDeletingPost}
      />
    </div>
  </div>

  {/* Modale eliminazione commento */}
  {showDeleteModal && commentToDelete && (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(12, 16, 20, 0.45)', backdropFilter: 'blur(0px)', WebkitBackdropFilter: 'blur(0px)' }}
      onClick={() => { setShowDeleteModal(false); setCommentToDelete(null); }}
    >
      <div
        className="rounded-xl w-[520px] max-w-[98vw] overflow-hidden bg-white dark:bg-[#212328]"
        onClick={e => e.stopPropagation()}
      >
        <button
          className="w-full h-14 border-b border-gray-300 dark:border-[#363636] text-[#ed4956] font-bold text-base hover:bg-gray-50 dark:hover:bg-[#23272b] transition-colors"
          style={{ fontSize: '1rem' }}
          onClick={handleDeleteComment}
          disabled={isDeletingComment}
        >
          {isDeletingComment ? 'Eliminazione...' : 'Elimina'}
        </button>
        <button
          className="w-full h-14 text-[#262626] dark:text-[#f8f9f9] text-base hover:bg-gray-50 dark:hover:bg-[#23272b] transition-colors rounded-b-xl"
          style={{ fontSize: '1rem' }}
          onClick={() => { setShowDeleteModal(false); setCommentToDelete(null); }}
        >
          Annulla
        </button>
      </div>
    </div>
  )}

      {/* Story Viewer */}
      {showStoryViewer && storyViewerUsername && storyViewerProfileId && (
        <StoryViewer
          profileUsername={storyViewerUsername}
          profileId={storyViewerProfileId}
          onClose={() => {
            setShowStoryViewer(false);
            setStoryViewerUsername(null);
            setStoryViewerProfileId(null);
          }}
          onAllStoriesViewed={(profileId) => {
            setViewedAllStoriesProfileIds(prev => new Set(prev).add(profileId));
          }}
        />
      )}
    </div>
  );
}