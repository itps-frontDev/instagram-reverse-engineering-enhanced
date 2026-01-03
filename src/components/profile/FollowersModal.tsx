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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(12, 16, 20, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#212328] rounded-xl w-[400px] max-w-[90vw] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con X chiusura */}
        <div className="relative flex items-center justify-center py-8 px-8">
          <h2 className="text-xl font-semibold text-center w-full text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]">
            {type === 'followers' ? 'Follower' : 'Chi segui'}
          </h2>
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <button type="button" tabIndex={0} onClick={onClose} className="p-2 rounded-full hover:bg-[rgb(37,41,46)] transition-colors">
              <div>
                <svg aria-label="Chiudi" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18">
                  <title>Chiudi</title>
                  <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line>
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-2 relative">
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={e => e.target.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(37,41,46)' : 'rgb(243,245,247)'}
            onBlur={e => e.target.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(54,54,54)' : 'rgb(239,239,239)'}
            className="appearance-none border-none rounded-[25px] box-border text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)] text-sm font-normal h-8 px-10 py-2 w-full outline-none bg-[rgb(239,239,239)] dark:bg-[rgb(54,54,54)]"
          />
          {searchQuery === '' && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none search-placeholder">
              <svg aria-label="Cerca" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16" className="text-[rgb(248,249,249)]">
                <title>Cerca</title>
                <path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22"></line>
              </svg>
              <span className="text-xs text-[rgb(248,249,249)]">Cerca</span>
            </div>
          )}
          <style>{`
            .input-focused + .search-placeholder { display: none !important; }
          `}</style>
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
                  <button className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex-shrink-0 ${type === 'followers' ? 'bg-[#EFEFEF] dark:bg-[#363636] text-instagram-primary hover:bg-gray-200 dark:hover:bg-[#2a2a2a]' : user.is_following ? 'bg-[rgb(240,242,245)] dark:bg-[rgb(37,41,46)] text-instagram-primary' : 'bg-[#0095F6] text-white hover:bg-[#1877F2]'}`}>
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
