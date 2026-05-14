/**
 * @fileoverview Card anteprima profilo.
 * 
 * Mostra una card hover con info profilo, anteprima post e pulsante follow.
 * 
 * FUNZIONALITÀ:
 * - Avatar e info utente (nome, username, verificato)
 * - Statistiche (post, follower, following)
 * - Griglia 3 post recenti
 * - Pulsanti Segui e Messaggio
 * - Gestione stati follow/pending
 * - Loading skeleton
 * 
 * @module components/profile/ProfilePreviewCard
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProfilePicture } from '@/components';
import { ShareIcon } from '@/components/common';
import { getProfilePreviewAction } from '@/features/profile';


// ============================================================================
// INTERFACCE
// ============================================================================
interface ProfilePreviewCardProps {
  username: string;
  onFollow?: () => void;
  onUnfollow?: () => void;
  isFollowing?: boolean;
  isPending?: boolean;
  isLoading?: boolean;
}

interface ProfileData {
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  posts_count: number;
  followers_count: number;
  following_count: number;
  follow_status: 'self' | 'none' | 'pending' | 'accepted';
  is_owner: boolean;
  can_view: boolean;
  recent_posts: Array<{
    id: number;
    media_url: string | null;
    type: string | null;
  }>;
}

// ============================================================================
// COMPONENTE
// ============================================================================
export default function ProfilePreviewCard({ 
  username, 
  onFollow, 
  onUnfollow,
  isFollowing = false,
  isPending = false,
  isLoading = false
}: ProfilePreviewCardProps) {
  const router = useRouter(); // Router per navigazione
  const [profile, setProfile] = useState<ProfileData | null>(null); 
  const [loading, setLoading] = useState(true);


  // Carica dati profilo al montaggio
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const result = await getProfilePreviewAction({ username });
        if (result.success && result.data) {
          setProfile(result.data);
        }
      } catch (error) {
        console.error('Error loading profile preview:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [username]);

  // Gestione click Messaggio
  const handleMessage = () => {
    if (profile?.username) {
      router.push(`/direct?username=${profile.username}`);
    }
  };

  // Skeleton loading
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
    <div className={`w-80 ml-[42px] rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 ${!profile.can_view && profile.recent_posts.length === 0 ? 'bg-gray-50 dark:bg-[#1a1a1a]' : 'bg-white dark:bg-[#262626]'}`}> 
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

      {/* Preview Post */}
      {!profile.can_view && profile.recent_posts.length === 0 ? (
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
          <p className="font-bold text-sm text-white mb-1">L&apos;account è privato</p>
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
              {post.type === 'reel' ? (
                <video
                  src={post.media_url || ''}
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={post.media_url || ''}
                  alt="Post"
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </Link>
          ))}
        </div>
      ) : null}

      {/* Follow/Message Buttons */}
      <div className="p-2">
        {isFollowing && !isPending ? (
          <div className="flex gap-2">
            <button
              onClick={handleMessage}
              className="flex-1 py-2 px-2 rounded-lg font-semibold text-sm transition-colors bg-[#3558c7] text-white hover:bg-[#4150f7] flex items-center justify-center gap-2"
            >
              <ShareIcon size={18} className="text-white" filled={false} />
              Messaggio
            </button>
            <button
              onClick={onUnfollow}
              disabled={isLoading}
              className="flex-1 py-2 px-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 bg-gray-100 dark:bg-[#363636] text-[#262626] dark:text-white hover:bg-gray-200 dark:hover:bg-[#454545]"
            >
              {isLoading ? '...' : 'Segui già'}
            </button>
          </div>
        ) : (
          <button
            onClick={(isFollowing || isPending) ? onUnfollow : onFollow}
            disabled={isLoading}
            className={`w-full py-2 px-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 ${
              isFollowing || isPending
                ? 'bg-gray-100 dark:bg-[#363636] text-[#262626] dark:text-white hover:bg-gray-200 dark:hover:bg-[#454545]'
                : 'bg-[#3558c7] text-white hover:bg-[#4150f7]'
            }`}
          >
            {isLoading ? '...' : isPending ? 'Richiesta effettuata' : isFollowing ? 'Segui già' : 'Segui'}
          </button>
        )}
      </div>
    </div>
  );
}
