/**
 * @fileoverview Sidebar suggerimenti utenti.
 *
 * Mostra il profilo utente corrente e suggerimenti di utenti da seguire.
 * 
 * FUNZIONALITÀ:
 * - Card profilo utente loggato
 * - Lista utenti suggeriti
 * - Pulsanti segui/segui già/in attesa
 * - Preview card al passaggio mouse
 * - Footer con link informativi
 * 
 * @module components/feed/Suggestions
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VerifiedBadge } from '@/components/common';
import {ProfilePicture} from '@/components';
import {ProfilePreviewCard} from '@/components/profile';
import { getProfileSuggestionsAction } from '@/features/profile/suggestions/actions';

interface SuggestedUser {
  id: number;
  username: string;
  fullName: string | null;
  profileImageUrl: string | null;
  followersCount: number;
}

export default function Suggestions() {
  const { profile, isLoading } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [loadingFollowIds, setLoadingFollowIds] = useState<Set<number>>(new Set());
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Carica suggerimenti utenti
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const result = await getProfileSuggestionsAction();
        if (result.success && result.data) {
          console.log('Suggestions API response:', result.data);
          // Map response to SuggestedUser interface
          const mapped: SuggestedUser[] = result.data.map(item => ({
            id: item.id,
            username: item.username,
            fullName: item.fullName || null,
            profileImageUrl: item.profileImageUrl || null,
            followersCount: item.followersCount,
          }));
          setSuggestions(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }

    if (profile) {
      fetchSuggestions();
    }
  }, [profile]);

  // Funzione per seguire un utente
  const handleFollow = async (userId: number) => {
    if (loadingFollowIds.has(userId)) return;

    setLoadingFollowIds(prev => new Set(prev).add(userId));

    try {
      const response = await fetch('/api/profiles/actions/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Follow response:', data);
        if (data.status === 'pending') {
          setPendingIds(prev => new Set(prev).add(userId));
        } else if (data.status === 'accepted') {
          setFollowingIds(prev => new Set(prev).add(userId));
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to follow user:', errorData);
      }
    } catch (error) {
      console.error('Error following user:', error);
    } finally {
      setLoadingFollowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Funzione per smettere di seguire un utente
  const handleUnfollow = async (userId: number) => {
    if (loadingFollowIds.has(userId)) return;

    setLoadingFollowIds(prev => new Set(prev).add(userId));

    try {
      const response = await fetch('/api/profiles/actions/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProfileId: userId }),
      });

      if (response.ok) {
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        setPendingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      } else {
        console.error('Failed to unfollow user');
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setLoadingFollowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (isLoading || !profile) {
    return null;
  }

  return (
    <aside className="hidden 2xl:block fixed left-1/2 ml-[calc(710px/2+20px)] top-24 w-80">
      <div className="space-y-4">
        {/* Current User Info */}
        <div className="flex items-center justify-between">
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-3">
            <div className="rounded-full overflow-hidden">
              <ProfilePicture
                src={profile.profile_image_url}
                alt={profile.username}
                size={52}
              />
            </div>
            <div>
              <p className="font-semibold text-sm text-[#262626] dark:text-white">
                <span className="text-[15px]">{profile.username}</span>
              </p>
              <p className="text-xs text-[#8E8E8E] dark:text-gray-400">
                {profile.full_name || profile.username}
              </p>
            </div>
          </Link>
          <button
            onClick={(e) => e.preventDefault()}
            className="text-xs font-semibold text-follow hover:underline"
          >
            Passa a
          </button>
        </div>

        {/* Suggestions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#8E8E8E] dark:text-gray-400">
              Suggeriti per te
            </p>
            <button className="text-xs font-semibold text-[#262626] dark:text-white hover:text-[#8E8E8E]">
              Mostra tutti
            </button>
          </div>

          {/* Suggested Users */}
          {loadingSuggestions ? (
            <div className="space-y-3">
              {Array(5)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                        <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between relative"
                  onMouseEnter={() => {
                    const timeout = setTimeout(() => {
                      setHoveredUser(user.username);
                    }, 500);
                    setHoverTimeout(timeout);
                  }}
                  onMouseLeave={() => {
                    if (hoverTimeout) {
                      clearTimeout(hoverTimeout);
                      setHoverTimeout(null);
                    }
                    setHoveredUser(null);
                  }}
                >
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <div className="rounded-full overflow-hidden">
                      <ProfilePicture
                        src={user.profileImageUrl}
                        alt={user.username}
                        size={40}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#262626] dark:text-white flex items-center gap-1">
                        <span className="text-[15px]">{user.username}</span>
                      </p>
                      <p className="text-xs text-[#8E8E8E] dark:text-gray-400">
                        {user.fullName || `${user.followersCount} follower`}
                      </p>
                    </div>
                  </Link>
                  <button 
                    onClick={() => (followingIds.has(user.id) || pendingIds.has(user.id)) ? handleUnfollow(user.id) : handleFollow(user.id)}
                    disabled={loadingFollowIds.has(user.id)}
                    className={`text-xs font-semibold ${
                      followingIds.has(user.id) || pendingIds.has(user.id)
                        ? 'text-[#84a0fe] dark:text-white'
                        : 'text-[#84a0fe]'
                    } disabled:opacity-50`}
                  >
                    {loadingFollowIds.has(user.id) 
                      ? '...' 
                      : pendingIds.has(user.id)
                        ? 'Richiesta effettuata'
                        : followingIds.has(user.id) 
                          ? 'Segui già' 
                          : 'Segui'}
                  </button>

                  {/* Profile Preview Card on Hover */}
                  {hoveredUser === user.username && (
                    <div className="absolute left-0 top-0 z-50">
                      <ProfilePreviewCard
                        username={user.username}
                        onFollow={() => handleFollow(user.id)}
                        onUnfollow={() => handleUnfollow(user.id)}
                        isFollowing={followingIds.has(user.id)}
                        isPending={pendingIds.has(user.id)}
                        isLoading={loadingFollowIds.has(user.id)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8E8E8E] dark:text-gray-400">
              Nessun suggerimento disponibile
            </p>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-xs space-y-4 text-[#a8a8a8]">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <a href="#" className="hover:underline">
              Informazioni
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Aiuto
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Stampa
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              API
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Lavora con noi
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Privacy
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Condizioni
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Luoghi
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Lingua
            </a>
            <span>·</span>
            <a href="#" className="hover:underline">
              Meta Verified
            </a>
          </div>

          <p className="text-xs">© {new Date().getFullYear()} INSTAGRAM FROM META</p>
        </div>
      </div>
    </aside>
  );
}

