/**
 * @fileoverview Profile grid component
 *
 * Displays posts in 3-column grid with 3:4 aspect ratio (Instagram 2025 format).
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Layers } from 'lucide-react';
import { ProfileGridProps } from '@/lib/types/profile';
import ProfileEmptyState from './ProfileEmptyState';

export default function ProfileGrid({
  posts,
  isLoading,
  onLoadMore,
  hasMore = false,
  tab = 'posts',
  isOwnProfile = false,
  onCreatePost,
}: ProfileGridProps) {
  if (isLoading && posts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-[3px]">
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
      <div className="grid grid-cols-3 gap-[3px]">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/p/${post.id}`}
            className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-800 group overflow-hidden"
          >
            <Image
              src={post.media_url}
              alt={post.caption || 'Post'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 25vw"
            />

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

            {/* Multi-media indicator */}
            {post.media_count > 1 && (
              <div className="absolute top-2 right-2">
                <Layers className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
            )}
          </Link>
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
