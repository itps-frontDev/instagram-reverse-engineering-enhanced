/**
 * @fileoverview Reels page component
 *
 * Full-screen vertical video feed with smooth sliding transitions.
 * Instagram-style reels interface with vertical swipe navigation.
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import Link from 'next/link';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import {
  Heart,
  MessageCircle,
  Bookmark,
  MoreHorizontal,
  X,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
  Play,
  Music,
  AtSign,
} from 'lucide-react';

interface ReelMedia {
  id: number;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number | null;
  position: number;
}

interface Reel {
  id: number;
  profile_id: number;
  caption: string | null;
  location: string | null;
  is_comments_disabled: boolean;
  is_likes_hidden: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile_username: string;
  profile_full_name: string | null;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  is_liked_by_current_user: boolean;
  is_saved_by_current_user: boolean;
  media: ReelMedia[];
}

interface Comment {
  id: number;
  profile_username: string;
  profile_image_url: string | null;
  profile_is_verified: boolean;
  text: string;
  likes_count: number;
  is_liked_by_current_user: boolean;
  created_at: string;
  replies?: Comment[];
}

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showExplodingHeart, setShowExplodingHeart] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const lastScrollTime = useRef(0);
  
  // Minimum swipe distance
  const minSwipeDistance = 50;

  // Fetch reels
  const fetchReels = useCallback(async (offset = 0) => {
    try {
      const response = await fetch(`/api/reels?limit=10&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch reels');
      
      const data = await response.json();
      
      if (offset === 0) {
        setReels(data.reels);
      } else {
        setReels(prev => [...prev, ...data.reels]);
      }
      
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  // Fetch comments for current reel
  const fetchComments = useCallback(async () => {
    const currentReel = reels[currentIndex];
    if (!currentReel) return;

    try {
      setIsLoadingComments(true);
      const response = await fetch(`/api/feed/comments?postId=${currentReel.id}&limit=50`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  }, [currentIndex, reels]);

  // Fetch comments when panel opens or reel changes
  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, currentIndex, fetchComments]);

  // Navigate to next/previous reel with smooth sliding animation
  const navigateToReel = useCallback((direction: 'next' | 'prev') => {
    if (isTransitioning) return;
    
    if (direction === 'next' && currentIndex < reels.length - 1) {
      setSlideDirection('up');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setIsTransitioning(false);
        setSlideDirection(null);
      }, 400);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSlideDirection('down');
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1);
        setIsTransitioning(false);
        setSlideDirection(null);
      }, 400);
    }
  }, [currentIndex, reels.length, isTransitioning]);

  // Handle video playback
  useEffect(() => {
    // Pause all videos
    videoRefs.current.forEach((video, index) => {
      if (index !== currentIndex) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Play current video
    const currentVideo = videoRefs.current.get(currentIndex);
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.play().catch(() => {});
      } else {
        currentVideo.pause();
      }
      currentVideo.muted = isMuted;
    }
  }, [currentIndex, isPlaying, isMuted]);

  // Load more reels when near the end
  useEffect(() => {
    if (currentIndex >= reels.length - 3 && hasMore && !isLoading) {
      fetchReels(reels.length);
    }
  }, [currentIndex, reels.length, hasMore, isLoading, fetchReels]);

  // Handle wheel scroll - one tick = one reel with smooth transition
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const now = Date.now();
    if (now - lastScrollTime.current < 500) return; // Debounce for smooth animation
    
    lastScrollTime.current = now;

    if (e.deltaY > 0) {
      navigateToReel('next');
    } else if (e.deltaY < 0) {
      navigateToReel('prev');
    }
  }, [navigateToReel]);

  // Touch handlers for mobile swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > minSwipeDistance;
    const isSwipeDown = distance < -minSwipeDistance;

    if (isSwipeUp) {
      navigateToReel('next');
    } else if (isSwipeDown) {
      navigateToReel('prev');
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showComments && e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          navigateToReel('next');
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          navigateToReel('prev');
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToReel, showComments]);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Like reel
  const handleLike = async (reelId: number) => {
    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    try {
      const endpoint = reel.is_liked_by_current_user 
        ? `/api/posts/${reelId}/unlike`
        : `/api/posts/${reelId}/like`;
      
      const response = await fetch(endpoint, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to like');

      setReels(prev => prev.map(r => 
        r.id === reelId 
          ? {
              ...r,
              is_liked_by_current_user: !r.is_liked_by_current_user,
              likes_count: r.is_liked_by_current_user 
                ? r.likes_count - 1 
                : r.likes_count + 1,
            }
          : r
      ));
    } catch (error) {
      console.error('Error liking reel:', error);
    }
  };

  // Save reel
  const handleSave = async (reelId: number) => {
    const reel = reels.find(r => r.id === reelId);
    if (!reel) return;

    try {
      const endpoint = reel.is_saved_by_current_user 
        ? `/api/posts/${reelId}/unsave`
        : `/api/posts/${reelId}/save`;
      
      const response = await fetch(endpoint, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to save');

      setReels(prev => prev.map(r => 
        r.id === reelId 
          ? { ...r, is_saved_by_current_user: !r.is_saved_by_current_user }
          : r
      ));
    } catch (error) {
      console.error('Error saving reel:', error);
    }
  };

  // Double-click to like
  const handleDoubleTap = (reelId: number) => {
    setShowExplodingHeart(true);
    setTimeout(() => setShowExplodingHeart(false), 1000);

    const reel = reels.find(r => r.id === reelId);
    if (reel && !reel.is_liked_by_current_user) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
      handleLike(reelId);
    }
  };

  // Submit comment
  const handleCommentSubmit = async () => {
    const currentReel = reels[currentIndex];
    if (!currentReel || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: currentReel.id, text: commentText }),
      });

      if (!response.ok) throw new Error('Failed to comment');
      
      const data = await response.json();
      setComments(prev => [data.comment, ...prev]);
      setCommentText('');

      // Update comment count
      setReels(prev => prev.map(r => 
        r.id === currentReel.id 
          ? { ...r, comments_count: r.comments_count + 1 }
          : r
      ));
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Like comment
  const handleCommentLike = async (commentId: number) => {
    try {
      const response = await fetch('/api/feed/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) throw new Error('Failed to like comment');
      const data = await response.json();

      setComments(prev => prev.map(c => 
        c.id === commentId 
          ? { ...c, is_liked_by_current_user: data.liked, likes_count: data.likes_count }
          : c
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  // Format numbers
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${Math.floor(count / 100) / 10}.${Math.floor((count % 100) / 10)}00,0`;
    return count.toString();
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} g`;
    return `${Math.floor(seconds / 604800)} sett`;
  };

  const currentReel = reels[currentIndex];

  if (isLoading && reels.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg-primary)] lg:left-[80px] xl:left-[336px] pb-14 lg:pb-0">
        <div className="text-[var(--color-text-primary)]">Caricamento reels...</div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg-primary)] lg:left-[80px] xl:left-[336px] pb-14 lg:pb-0">
        <div className="text-[var(--color-text-primary)] text-center">
          <p className="text-xl mb-2">Nessun reel disponibile</p>
          <p className="text-[var(--color-text-secondary)]">I reels appariranno qui</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-[var(--color-bg-primary)] overflow-hidden lg:left-[80px] xl:left-[336px] pb-14 lg:pb-0"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Main Reels Container */}
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Reels Stack with Sliding Animation */}
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
          {reels.map((reel, index) => {
            // Only render current, previous, and next reels for performance
            const isVisible = Math.abs(index - currentIndex) <= 1;
            if (!isVisible) return null;

            // Calculate position and animation state
            const isCurrent = index === currentIndex;
            const isPrev = index === currentIndex - 1;
            const isNext = index === currentIndex + 1;

            let translateY = '0%';
            let opacity = 1;
            let scale = 1;

            if (isPrev) {
              translateY = '-100%';
              opacity = isTransitioning && slideDirection === 'down' ? 1 : 0;
            } else if (isNext) {
              translateY = '100%';
              opacity = isTransitioning && slideDirection === 'up' ? 1 : 0;
            } else if (isCurrent && isTransitioning) {
              translateY = slideDirection === 'up' ? '-100%' : '100%';
              opacity = 0;
            }

            return (
              <div
                key={reel.id}
                className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-out"
                style={{
                  transform: `translateY(${translateY}) scale(${scale})`,
                  opacity,
                  zIndex: isCurrent ? 10 : 5,
                  transitionDuration: '400ms',
                }}
              >
                {/* Single Reel Container with Side Actions */}
                <div className="relative flex items-center gap-4">
                  {/* Video Container - responsive height for mobile nav */}
                  <div 
                    className="relative w-[420px] h-[calc(100vh-80px)] lg:h-[calc(100vh-40px)] max-h-[900px] rounded-lg overflow-hidden"
                    onDoubleClick={() => handleDoubleTap(reel.id)}
                    onClick={() => setIsPlaying(prev => !prev)}
                  >
                    {/* Video */}
                    {reel.media[0] && (
                      <>
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current.set(index, el);
                          }}
                          src={reel.media[0].media_url}
                          className="absolute inset-0 w-full h-full object-cover"
                          loop
                          muted={isMuted}
                          playsInline
                          autoPlay={isCurrent}
                        />

                        {/* Gradient Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

                        {/* Play/Pause Indicator */}
                        {!isPlaying && isCurrent && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <Play className="w-20 h-20 text-white/80 fill-white/80" />
                          </div>
                        )}

                        {/* Heart Animation on Double Tap */}
                        {showExplodingHeart && isCurrent && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            <Heart
                              className="w-28 h-28 fill-white text-white animate-ping"
                              style={{ animationDuration: '0.6s' }}
                            />
                          </div>
                        )}

                        {/* Mute Button - Top Right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(prev => !prev);
                          }}
                          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#262626]/70 flex items-center justify-center hover:bg-[#262626] transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </button>

                        {/* Bottom Info Section - Always white text on video */}
                        <div className="absolute bottom-4 left-3 right-3 z-20">
                          {/* User Info Row */}
                          <div className="flex items-center gap-2 mb-2">
                            <Link href={`/profile/${reel.profile_username}`} onClick={(e) => e.stopPropagation()}>
                              <ProfilePicture
                                src={reel.profile_image_url}
                                alt={reel.profile_username}
                                size={36}
                              />
                            </Link>
                            <Link 
                              href={`/profile/${reel.profile_username}`}
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-white font-semibold text-sm">
                                {reel.profile_username}
                              </span>
                              {reel.profile_is_verified && <VerifiedBadge size={12} />}
                            </Link>
                            <span className="text-white/70">•</span>
                            <button 
                              className="text-white text-sm font-semibold border border-white/40 rounded-md px-3 py-1 hover:bg-white/10 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Segui
                            </button>
                          </div>

                          {/* Caption */}
                          {reel.caption && (
                            <p className="text-white text-sm mb-3 line-clamp-2 leading-relaxed">
                              {reel.caption}
                            </p>
                          )}

                          {/* Audio/Music Info */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                              <Music className="w-3 h-3 text-white" />
                              <span className="text-white text-xs">{reel.profile_username} · Audio originale</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Side Actions Panel - Outside video on the right, aligned to bottom */}
                  <div className="flex flex-col items-center gap-4 self-end mb-4">
                    {/* Like Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!reel.is_liked_by_current_user) {
                          setIsLikeAnimating(true);
                          setTimeout(() => setIsLikeAnimating(false), 400);
                        }
                        handleLike(reel.id);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Heart
                        className={`w-7 h-7 transition-transform ${
                          reel.is_liked_by_current_user
                            ? 'fill-[var(--color-like)] text-[var(--color-like)]'
                            : 'text-[var(--color-text-primary)]'
                        } ${isLikeAnimating && isCurrent ? 'scale-125' : ''}`}
                      />
                      <span className="text-[var(--color-text-primary)] text-xs font-medium">
                        {formatCount(reel.likes_count)}
                      </span>
                    </button>

                    {/* Comments Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowComments(true);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <MessageCircle className="w-7 h-7 text-[var(--color-text-primary)]" />
                      <span className="text-[var(--color-text-primary)] text-xs font-medium">
                        {reel.comments_count}
                      </span>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center gap-1"
                    >
                      <svg
                        className="w-7 h-7 text-[var(--color-text-primary)]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                      >
                        <path d="M21.5 2.5Q16 8 11 13"/>
                        <path d="M21.5 2.5Q18 12 15.5 20Q15 21.5 14 21Q12.5 17 11 13Q7 11.5 3 10Q2 9 2.5 8.5Q11 5.5 21.5 2.5Z"/>
                      </svg>
                    </button>

                    {/* Save Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(reel.id);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Bookmark
                        className={`w-7 h-7 ${
                          reel.is_saved_by_current_user
                            ? 'fill-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      />
                    </button>

                    {/* More Options */}
                    <button onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-7 h-7 text-[var(--color-text-primary)]" />
                    </button>

                    {/* Music/Audio Disc */}
                    <div className="w-8 h-8 rounded-md overflow-hidden border-2 border-[var(--color-border)] mt-1 animate-spin" style={{ animationDuration: '3s' }}>
                      <ProfilePicture
                        src={reel.profile_image_url}
                        alt={reel.profile_username}
                        size={28}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comments Panel Modal */}
      {showComments && currentReel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setShowComments(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70" />

          {/* Comments Modal */}
          <div
            className="relative w-[400px] max-h-[80vh] bg-[var(--color-bg-primary)] rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <span className="text-base font-semibold text-[var(--color-text-primary)]">
                Commenti
              </span>
              <button
                onClick={() => setShowComments(false)}
                className="text-[var(--color-text-primary)] hover:opacity-70"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sort Option */}
            <div className="px-4 py-2 border-b border-[var(--color-border)]">
              <button className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
                Per te
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 max-h-[50vh]">
              {isLoadingComments ? (
                <div className="text-center text-[var(--color-text-secondary)] py-8">
                  Caricamento commenti...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-[var(--color-text-secondary)] py-8">
                  Nessun commento ancora. Sii il primo!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 mb-4">
                    <Link href={`/profile/${comment.profile_username}`}>
                      <ProfilePicture
                        src={comment.profile_image_url}
                        alt={comment.profile_username}
                        size={36}
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/profile/${comment.profile_username}`}
                              className="font-semibold text-sm text-[var(--color-text-primary)] hover:opacity-70"
                            >
                              {comment.profile_username}
                            </Link>
                            {comment.profile_is_verified && <VerifiedBadge size={10} />}
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--color-text-primary)] mt-0.5">
                            {comment.text}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              Mi piace: {comment.likes_count}
                            </span>
                            <button className="text-xs text-[var(--color-text-secondary)] font-semibold">
                              Rispondi
                            </button>
                            <button className="text-xs text-[var(--color-text-secondary)]">
                              Vedi traduzione
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCommentLike(comment.id)}
                          className="mt-1"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              comment.is_liked_by_current_user
                                ? 'fill-[var(--color-like)] text-[var(--color-like)]'
                                : 'text-[var(--color-text-secondary)]'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="border-t border-[var(--color-border)] px-4 py-3">
              <div className="flex items-center gap-3">
                <ProfilePicture
                  src={null}
                  alt="You"
                  size={36}
                />
                <input
                  type="text"
                  placeholder="Aggiungi un commento..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] outline-none"
                />
                <button className="text-xl">😊</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
