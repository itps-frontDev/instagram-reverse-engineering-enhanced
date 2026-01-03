/**
 * @fileoverview Post modal component
 *
 * Displays a post in a modal with all comments and ability to comment.
 */

'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  X,
} from 'lucide-react';
import type { FeedPost, Comment, GetCommentsResponse } from '@/lib/types/feed';

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
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      fetchComments();
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, post.id]);

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
      const response = await fetch(`/api/feed/comments?postId=${post.id}&limit=50`);
      
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data: GetCommentsResponse = await response.json();
      setComments(data.comments);
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
      const body: any = { 
        postId: post.id, 
        text: commentText 
      };
      
      // Aggiungere parentId se si sta rispondendo a un commento
      if (replyingTo) {
        body.parentId = replyingTo.id;
      }

      const response = await fetch('/api/feed/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to comment');

      const data = await response.json();
      
      // Aggiungere il nuovo commento in testa alla lista (solo commenti top-level)
      if (!replyingTo) {
        setComments([data.comment, ...comments]);
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
    try {
      const response = await fetch('/api/feed/comments/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId }),
      });

      if (!response.ok) throw new Error('Failed to like comment');

      const data = await response.json();

      // Aggiornare lo stato locale del commento
      setComments((prevComments) =>
        prevComments.map((comment) =>
          comment.id === commentId
            ? {
                ...comment,
                is_liked_by_current_user: data.liked,
                likes_count: data.likes_count,
              }
            : comment
        )
      );
    } catch (error) {
      console.error('Error liking comment:', error);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Close Button - Outside modal */}
      <button
        onClick={onClose}
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
                {post.profile_is_verified && <VerifiedBadge size={14} />}
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
                <div key={comment.id} className="flex gap-3 mb-4">
                  <Link href={`/profile/${comment.profile_username}`}>
                    <ProfilePicture
                      src={comment.profile_image_url}
                      alt={comment.profile_username || 'Profile picture'}
                      size={32}
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="text-sm">
                      <Link
                        href={`/profile/${comment.profile_username}`}
                        className="font-semibold text-[#262626] dark:text-[#FAFAFA] hover:opacity-50 mr-2"
                      >
                        {comment.profile_username}
                      </Link>
                      {comment.profile_is_verified && <span className="-ml-1 mr-1 inline-block"><VerifiedBadge size={12} /></span>}
                      <span className="text-[#262626] dark:text-[#FAFAFA]">
                        {comment.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-1">
                      <span>{formatTimeAgo(comment.created_at)}</span>
                      {comment.likes_count > 0 && (
                        <span className="font-semibold">
                          {comment.likes_count} {comment.likes_count === 1 ? 'Mi piace' : 'Mi piace'}
                        </span>
                      )}
                      <button 
                        onClick={() => setReplyingTo(comment)}
                        className="font-semibold hover:opacity-50"
                      >
                        Rispondi
                      </button>
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
                      <div key={reply.id} className="flex gap-3">
                        <Link href={`/profile/${reply.profile_username}`}>
                          <ProfilePicture
                            src={reply.profile_image_url}
                            alt={reply.profile_username || 'Profile picture'}
                            size={28}
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="text-sm">
                            <Link
                              href={`/profile/${reply.profile_username}`}
                              className="font-semibold text-[#262626] dark:text-[#FAFAFA] hover:opacity-50 mr-2"
                            >
                              {reply.profile_username}
                            </Link>
                            {reply.profile_is_verified && <span className="-ml-1 mr-1 inline-block"><VerifiedBadge size={12} /></span>}
                            <span className="text-[#262626] dark:text-[#FAFAFA]">
                              {reply.text}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[#8E8E8E] dark:text-[#A8A8A8] mt-1">
                            <span>{formatTimeAgo(reply.created_at)}</span>
                            {reply.likes_count > 0 && (
                              <span className="font-semibold">
                                {reply.likes_count} Mi piace
                              </span>
                            )}
                            <button 
                              onClick={() => setReplyingTo(comment)}
                              className="font-semibold hover:opacity-50"
                            >
                              Rispondi
                            </button>
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
                <button className="hover:opacity-50 transition-opacity cursor-pointer">
                  <MessageCircle className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA]" />
                </button>
                <button className="hover:opacity-50 transition-opacity -translate-y-0.5">
                  <svg
                    className="w-6 h-6 text-[#262626] dark:text-[#FAFAFA] rotate-[60deg]"
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

