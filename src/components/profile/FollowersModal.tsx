/**
 * @fileoverview Followers/Following Modal Component
 *
 * Modal that displays a list of followers or following users.
 * Includes search functionality and follow/unfollow actions.
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
}

interface FollowerUser {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_following: number; // SQLite returns 0 or 1
  follows_you: number;
}

interface SuggestedUser {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  followers_count?: number;
}

export default function FollowersModal({
  isOpen,
  onClose,
  username,
  type,
}: FollowersModalProps) {
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      if (type === 'followers') {
        fetchSuggestedUsers();
      }
    }
  }, [isOpen, type, username]);

  async function fetchUsers() {
    setIsLoading(true);
    try {
      const endpoint = type === 'followers' ? 'followers' : 'following';
      const res = await fetch(`/api/profiles/${username}/${endpoint}`);

      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await res.json();
      setUsers(data.followers || data.following || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchSuggestedUsers() {
    try {
      const res = await fetch('/api/profiles/suggestions');

      if (!res.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await res.json();
      setSuggestedUsers(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    }
  }

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overlay-bg"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[rgb(38,38,38)] rounded-xl w-[400px] h-[400px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-[#DBDBDB] dark:border-[#2b3036] h-[43px] flex items-center justify-between px-4">
          <div className="w-6"></div>
          <h2 className="font-semibold text-base text-instagram-primary">
            {type === 'followers' ? 'Follower' : 'Seguiti'}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-light text-instagram-primary leading-none hover:opacity-70"
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-[#DBDBDB] dark:border-[#2b3036]">
          <input
            type="text"
            placeholder="Cerca"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#EFEFEF] dark:bg-[#262626] text-instagram-primary rounded-lg text-sm outline-none"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Caricamento...
            </div>
          ) : filteredUsers.length === 0 && searchQuery ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nessun utente trovato
            </div>
          ) : (
            <>
              {/* Lista follower/following */}
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
                >
                  <Link
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={onClose}
                  >
                    <Image
                      src={user.profile_image_url || '/images/default-pfp.jpg'}
                      alt={user.username}
                      width={44}
                      height={44}
                      className="rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm text-instagram-primary truncate">
                        {user.username}
                      </span>
                      {user.full_name && (
                        <span className="text-gray-500 text-sm truncate">
                          {user.full_name}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Pulsante Rimuovi per followers, Segui già per following */}
                  <button className="px-4 py-1.5 bg-[#EFEFEF] dark:bg-[#363636] rounded-lg text-sm font-semibold text-instagram-primary hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-colors flex-shrink-0">
                    {type === 'followers' ? 'Rimuovi' : user.is_following ? 'Segui già' : 'Segui'}
                  </button>
                </div>
              ))}

              {/* Suggeriti per te - solo nella modale follower */}
              {type === 'followers' && !searchQuery && suggestedUsers.length > 0 && (
                <>
                  <div className="px-4 py-3 border-t border-[#DBDBDB] dark:border-[#2b3036]">
                    <h3 className="font-semibold text-sm text-instagram-primary">
                      Suggeriti per te
                    </h3>
                  </div>
                  {suggestedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
                    >
                      <Link
                        href={`/profile/${user.username}`}
                        className="flex items-center gap-3 flex-1 min-w-0"
                        onClick={onClose}
                      >
                        <Image
                          src={user.profile_image_url || '/images/default-pfp.jpg'}
                          alt={user.username}
                          width={44}
                          height={44}
                          className="rounded-full object-cover flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm text-instagram-primary truncate">
                            {user.username}
                          </span>
                          {user.full_name && (
                            <span className="text-gray-500 text-sm truncate">
                              {user.full_name}
                            </span>
                          )}
                          {user.followers_count !== undefined && (
                            <span className="text-gray-400 text-xs truncate">
                              Follower: {user.followers_count}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* Pulsante Segui */}
                      <button className="px-6 py-1.5 bg-[#0095F6] rounded-lg text-sm font-semibold text-white hover:bg-[#1877F2] transition-colors flex-shrink-0">
                        Segui
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
