/**
 * @fileoverview Explore Grid Component
 *
 * Displays posts in a grid layout with hover effects
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Heart, MessageCircle, Play } from 'lucide-react';
import type { FeedPost } from '@/lib/types/feed';
import PostModal from '@/components/feed/PostModal';

interface ExploreGridProps {
  posts: FeedPost[];
  onLike: (postId: number) => void;
  onSave: (postId: number) => void;
  onComment: (postId: number, text: string) => void;
}

export default function ExploreGrid({
  posts,
  onLike,
  onSave,
  onComment,
}: ExploreGridProps) {
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const selectedPost = selectedPostIndex !== null ? posts[selectedPostIndex] : null;

  const handleNext = () => {
    if (selectedPostIndex !== null && selectedPostIndex < posts.length - 1) {
      setSelectedPostIndex(selectedPostIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedPostIndex !== null && selectedPostIndex > 0) {
      setSelectedPostIndex(selectedPostIndex - 1);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {posts.map((post, index) => {
          const firstMedia = post.media[0];
          if (!firstMedia) return null;

          const isVideo = firstMedia.media_type === 'video';

          return (
            <button
              key={post.id}
              onClick={() => setSelectedPostIndex(index)}
              className="group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer"
            >
              {/* Image/Video */}
              <Image
                src={firstMedia.media_url}
                alt={post.caption || 'Post'}
                fill
                sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                className="object-cover"
              />

              {/* Video indicator */}
              {isVideo && (
                <div className="absolute top-2 right-2 z-10">
                  <Play className="w-6 h-6 text-white drop-shadow-lg" fill="white" />
                </div>
              )}

              {/* Multiple images indicator */}
              {post.media.length > 1 && (
                <div className="absolute top-2 right-2 z-10">
                  <svg
                    className="w-6 h-6 text-white drop-shadow-lg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      strokeWidth="2"
                    />
                    <rect
                      x="7"
                      y="7"
                      width="10"
                      height="10"
                      rx="1"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <Heart className="w-6 h-6" fill="white" />
                  <span>{formatCount(post.likes_count)}</span>
                </div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <MessageCircle className="w-6 h-6" fill="white" />
                  <span>{formatCount(post.comments_count)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Post Modal */}
      {selectedPost && selectedPostIndex !== null && (
        <PostModal
          post={selectedPost}
          isOpen={true}
          onClose={() => setSelectedPostIndex(null)}
          onLike={onLike}
          onSave={onSave}
          onComment={onComment}
          onNext={handleNext}
          onPrev={handlePrev}
          hasNext={selectedPostIndex < posts.length - 1}
          hasPrev={selectedPostIndex > 0}
        />
      )}
    </>
  );
}
