/**
 * @fileoverview Profile grid component
 *
 * Displays posts in 3-column grid with 3:4 aspect ratio (Instagram 2025 format).
 */

'use client';

import Image from 'next/image';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { ProfileGridProps } from '@/lib/types/profile';
import ProfileEmptyState from './ProfileEmptyState';
import CarouselIcon from '@/components/common/CarouselIcon';

export default function ProfileGrid({
  posts,
  isLoading,
  onLoadMore,
  hasMore = false,
  tab = 'posts',
  isOwnProfile = false,
  onCreatePost,
  onPostClick,
}: ProfileGridProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-[1px] md:gap-[3px]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] bg-gray-200 dark:bg-gray-800 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return <ProfileEmptyState tab={tab} isOwnProfile={isOwnProfile} onCreatePost={onCreatePost} />;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-[1px] md:gap-[3px]">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => onPostClick?.(post)}
            className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 group overflow-hidden cursor-pointer"
          >
            {post.media_type === 'video' ? (
              <>
                <video
                  src={post.media_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
                {/* Video/Reels indicator */}
                <div className="absolute top-2 right-2">
                  <svg
                    className="w-5 h-5 text-white drop-shadow-lg"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="currentColor"/>
                    <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="rgba(0, 0, 0, 0.6)"/>
                  </svg>
                </div>
              </>
            ) : (
              <Image
                src={post.media_url}
                alt={post.caption || 'Post'}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 25vw"
              />
            )}

            {/* Multi-media indicator */}
            {post.media_count > 1 && (
              <div className="absolute top-2 right-2">
                <CarouselIcon className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Heart className="w-6 h-6 fill-white" />
                <span>{post.likes_count}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <MessageCircle className="w-6 h-6 fill-white" />
                <span>{post.comments_count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <div className="py-8 text-center">
          <button
            onClick={onLoadMore}
            className="text-[#0095f6] font-semibold text-sm hover:opacity-70"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
