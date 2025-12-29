/**
 * @fileoverview Sidebar with user suggestions and current user info
 *
 * Shows the current user's profile and suggested users to follow.
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface SuggestedUser {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  followers_count: number;
}

export default function Suggestions() {
  const { profile, isLoading } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const response = await fetch('/api/profiles/suggestions');
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.profiles || []);
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

  if (isLoading || !profile) {
    return null;
  }

  return (
    <aside className="hidden xl:block fixed right-16 top-24 w-80">
      <div className="space-y-4">
        {/* Current User Info */}
        <div className="flex items-center justify-between">
          <Link href={`/profile/${profile.username}`} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-lg font-semibold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-[#262626] dark:text-white">
                {profile.username}
              </p>
              <p className="text-xs text-[#8E8E8E] dark:text-gray-400">
                {profile.full_name || profile.username}
              </p>
            </div>
          </Link>
          <Link
            href="/api/auth/logout"
            className="text-xs font-semibold text-[#0095F6] hover:text-[#1877F2]"
          >
            Cambia
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#8E8E8E] dark:text-gray-400">
              Suggerimenti per te
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
                <div key={user.id} className="flex items-center justify-between">
                  <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={user.username}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-semibold">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#262626] dark:text-white flex items-center gap-1">
                        {user.username}
                        {user.is_verified && (
                          <svg className="w-3 h-3 text-[#0095F6]" fill="currentColor" viewBox="0 0 40 40">
                            <path d="M19.998 3.094l2.124 3.217c.297.45.835.76 1.421.82l3.839.394c1.358.139 1.915 1.854.92 2.815l-2.817 2.72c-.395.382-.603.99-.541 1.593l.386 3.842c.138 1.364-1.188 2.407-2.425 1.845l-3.42-1.813c-.48-.253-1.05-.253-1.529 0l-3.42 1.813c-1.236.562-2.564-.48-2.425-1.845l.386-3.842c.062-.603-.145-1.21-.541-1.593l-2.817-2.72c-.996-.961-.439-2.676.92-2.815l3.838-.394c.587-.06 1.124-.37 1.422-.82l2.123-3.217c.592-.898 2.147-.898 2.739 0z"/>
                          </svg>
                        )}
                      </p>
                      <p className="text-xs text-[#8E8E8E] dark:text-gray-400">
                        {user.full_name || `${user.followers_count} follower`}
                      </p>
                    </div>
                  </Link>
                  <button className="text-xs font-semibold text-[#0095F6] hover:text-[#1877F2]">
                    Segui
                  </button>
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

          <p className="text-xs">© 2025 INSTAGRAM FROM META</p>
        </div>
      </div>
    </aside>
  );
}
