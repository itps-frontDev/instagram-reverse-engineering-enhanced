/**
 * @fileoverview Profile preview card component
 * 
 * Shows a hover preview card with profile info, posts preview, and follow button.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';

interface ProfilePreviewCardProps {
  username: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  isPending?: boolean;
  isLoading?: boolean;
}

interface ProfileData {
  id: number;
  username: string;
  full_name: string | null;
  bio: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  posts_count: number;
  followers_count: number;
  following_count: number;
  recent_posts: Array<{
    id: number;
    media_url: string;
    media_type: string;
  }>;
}

export default function ProfilePreviewCard({ 
  username, 
  onFollow, 
  onUnfollow,
  isFollowing = false,
  isPending = false,
  isLoading = false
}: ProfilePreviewCardProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch(`/api/profiles/${username}/preview`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error loading profile preview:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  if (loading || !profile) {
    return (
      <div className="w-80 bg-white dark:bg-[#262626] rounded-lg shadow-2xl p-5 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 ml-[42px] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${profile.is_private && profile.recent_posts.length === 0 ? 'bg-gray-50 dark:bg-[#1a1a1a]' : 'bg-white dark:bg-[#262626]'}`}> 
      {/* Header */}
      <div className="p-5 pb-2">
        <div className="flex items-start gap-4">
          <Link href={`/profile/${profile.username}`}>
            <ProfilePicture
              src={profile.profile_image_url}
              alt={profile.username}
              size={56}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link 
              href={`/profile/${profile.username}`}
              className="font-semibold text-sm text-[#262626] dark:text-white hover:opacity-70 flex items-center gap-1"
            >
              {profile.username}
              {profile.is_verified && <VerifiedBadge size={12} />}
            </Link>
            <p className="text-sm text-[#8E8E8E] dark:text-gray-400">
              {profile.full_name}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-around pt-3 pb-1">
          <div className="text-center">
            <p className="font-bold text-sm text-[#262626] dark:text-white">{profile.posts_count}</p>
            <p className="text-xs text-[#8E8E8E] dark:text-gray-400">post</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-[#262626] dark:text-white">{profile.followers_count}</p>
            <p className="text-xs text-[#8E8E8E] dark:text-gray-400">follower</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-[#262626] dark:text-white">{profile.following_count}</p>
            <p className="text-xs text-[#8E8E8E] dark:text-gray-400">seguiti</p>
          </div>
        </div>
      </div>

      {/* Recent Posts Preview OR Private Account Message */}
      {profile.is_private && profile.recent_posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 px-4">
          {/* Instagram gradient lock icon with circle */}
          <div className="mb-3">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f09433" />
                  <stop offset="25%" stopColor="#e6683c" />
                  <stop offset="50%" stopColor="#dc2743" />
                  <stop offset="75%" stopColor="#cc2366" />
                  <stop offset="100%" stopColor="#bc1888" />
                </linearGradient>
              </defs>
              <circle cx="28" cy="28" r="26" stroke="url(#instagramGradient)" strokeWidth="2.5" fill="none" />
              <rect x="19" y="28" width="18" height="13" rx="3" stroke="url(#instagramGradient)" strokeWidth="2" fill="none"/>
              <path d="M22 28 C22 16, 34 16, 34 28" stroke="url(#instagramGradient)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            </svg>
          </div>
          <p className="font-bold text-sm text-white mb-1">L'account è privato</p>
          <p className="text-xs text-[#8E8E8E] text-center">Segui questo account per vedere le foto e i video.</p>
        </div>
      ) : profile.recent_posts.length > 0 ? (
        <div className="grid grid-cols-3 gap-0.5 bg-gray-100 dark:bg-black">
          {profile.recent_posts.slice(0, 3).map((post) => (
            <Link 
              key={post.id} 
              href={`/p/${post.id}`}
              className="aspect-square relative overflow-hidden hover:opacity-80 transition-opacity"
            >
              {post.media_type === 'video' ? (
                <video
                  src={post.media_url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={post.media_url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              )}
            </Link>
          ))}
        </div>
      ) : null}

      {/* Follow Button */}
      <div className="p-2">
        <button
          onClick={(isFollowing || isPending) ? onUnfollow : onFollow}
          disabled={isLoading}
          className={`w-full py-2 px-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
            isFollowing || isPending
              ? 'bg-gray-100 dark:bg-[#363636] text-[#262626] dark:text-white hover:bg-gray-200 dark:hover:bg-[#454545]'
              : 'bg-[#3558c7] text-white hover:bg-[#4150f7]'
          }`}
        >
          {isLoading ? '...' : isPending ? 'Richiesta effettuata' : isFollowing ? 'Seguito' : 'Segui'}
        </button>
      </div>
    </div>
  );
}
