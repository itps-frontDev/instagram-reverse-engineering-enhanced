/**
 * @fileoverview Modal follower/following.
 *
 * Modal che mostra la lista di follower o following.
 * Include funzionalità di ricerca e azioni follow/unfollow.
 * 
 * FUNZIONALITÀ:
 * - Lista follower o following paginata
 * - Ricerca in lista
 * - Pulsanti follow/unfollow con stati
 * - Suggerimenti utenti (solo propri follower)
 * - Rimozione follower (solo propri)
 * - Modal unfollow per conferma
 * 
 * @module components/profile/FollowersModal
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { getFollowersAction, getFollowingAction, toggleFollowAction, removeFollowerAction, getSuggestionsAction } from '@/features/follow';
import { getMediaUrl } from '@/lib/media';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  type: 'followers' | 'following';
  isOwnProfile?: boolean;
}

interface FollowerUser {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_following: boolean; // Converted by repository from SQLite 0/1 to boolean
  follows_you: boolean;
  isPending?: boolean; // Per tracciare richieste di follow in attesa
}

interface SuggestedUser {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  followers_count?: number;
  mutual_followers?: Array<{ username: string }>;
  mutual_count?: number;
  is_following?: boolean;
  isPending?: boolean;
}

export default function FollowersModal({
  isOpen,
  onClose,
  username,
  type,
  isOwnProfile = false,
}: FollowersModalProps) {
  const { profile: currentProfile } = useAuth();
  const [users, setUsers] = useState<FollowerUser[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [removedUsers, setRemovedUsers] = useState<Set<number>>(new Set());

  // Funzione per caricare follower o following
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      if (type === 'followers') {
        const actionResult = await getFollowersAction({ username });
        if (!actionResult.success || !actionResult.data) {
          throw new Error(actionResult.error || 'Failed to fetch followers');
        }
        setUsers(actionResult.data.followers);
      } else {
        const actionResult = await getFollowingAction({ username });
        if (!actionResult.success || !actionResult.data) {
          throw new Error(actionResult.error || 'Failed to fetch following');
        }
        // Trasforma la struttura della response in quella aspettata da FollowerUser
        const followingUsers: FollowerUser[] = actionResult.data.map((profile: { id: number; username: string; fullName: string | null; profileImageUrl: string | null; followStatus: 'none' | 'pending' | 'accepted' }) => ({
          id: profile.id,
          username: profile.username,
          full_name: profile.fullName ?? null,
          profile_image_url: profile.profileImageUrl ?? null,
          is_verified: false, // TODO: aggiungere al backend se necessario
          is_following: profile.followStatus === 'accepted',
          follows_you: false, // TODO: calcolare dal backend
          isPending: profile.followStatus === 'pending',
        }));
        setUsers(followingUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, username]);

  // Funzione per caricare utenti suggeriti
  const fetchSuggestedUsers = useCallback(async () => {
    try {
      const result = await getSuggestionsAction();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch suggestions');
      }

      const suggestions = result.data.map((user) => ({
        id: user.id,
        username: user.username,
        full_name: user.fullName ?? null,
        profile_image_url: user.profileImageUrl ?? null,
        is_verified: false,
        followers_count: user.followersCount,
        is_following: false,
        isPending: false,
      }));
      setSuggestedUsers(suggestions);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
      setSuggestedUsers([]);
    }
  }, []);

  // Carica follower/following quando si apre il modal
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        void fetchUsers();
      }, 0);
      // Recupera suggeriti SOLO se profilo proprio E tab followers
      if (type === 'followers' && isOwnProfile) {
        setTimeout(() => {
          void fetchSuggestedUsers();
        }, 0);
      }
    }
  }, [fetchSuggestedUsers, fetchUsers, isOpen, isOwnProfile, type]);

  // Funzione per seguire un utente
  async function handleFollow(targetProfileId: number) {
    try {
      const result = await toggleFollowAction({ targetProfileId });
      if (result.success && result.data) {
        const isFollowing = result.data.status === 'accepted';
        const isPending = result.data.status === 'pending';
        // Aggiorna stato con nuovo follow status
        setUsers(prev => prev.map(u =>
          u.id === targetProfileId
            ? { ...u, is_following: isFollowing, isPending }
            : u
        ));
        // Aggiorna stato utenti suggeriti
        setSuggestedUsers(prev => prev.map(u =>
          u.id === targetProfileId
            ? { ...u, is_following: isFollowing, isPending }
            : u
        ));
      }
    } catch (error) {
      console.error('Error following user:', error);
    }
  }

  // Funzione per smettere di seguire un utente
  async function handleUnfollow(targetProfileId: number, isSuggested: boolean = false) {
    try {
      // Se era un follower rimosso dal proprio profilo, aggiungi a removedUsers SUBITO (ottimistico)
      if (isOwnProfile && type === 'followers' && !isSuggested) {
        setRemovedUsers(prev => {
          const newSet = new Set(prev);
          newSet.add(targetProfileId);
          return newSet;
        });
      }
      
      // Scegli l'azione giusta in base al contesto
      // I suggested users devono SEMPRE usare toggle (unfollow), non remove-follower
      const isRemoveFollower = isOwnProfile && type === 'followers' && !isSuggested;
      const result = isRemoveFollower
        ? await removeFollowerAction({ profileId: targetProfileId })
        : await toggleFollowAction({ targetProfileId });

      if (result.success) {
        // Aggiorna follow status (non rimuove dalla lista immediatamente)
        setUsers(prev => prev.map(u =>
          u.id === targetProfileId
            ? { ...u, is_following: false, isPending: false }
            : u
        ));

        // Aggiorna stato utenti suggeriti
        setSuggestedUsers(prev => prev.map(u =>
          u.id === targetProfileId
            ? { ...u, is_following: false, isPending: false }
            : u
        ));
      } else {
        // Se fallisce, rimuovi da removedUsers
        if (isOwnProfile && type === 'followers' && !isSuggested) {
          setRemovedUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(targetProfileId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      // Se c'è un errore, rimuovi da removedUsers
      if (isOwnProfile && type === 'followers' && !isSuggested) {
        setRemovedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(targetProfileId);
          return newSet;
        });
      }
    }
  }

  if (!isOpen) return null;

  let filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Se l'utente corrente è nella lista, mettilo in prima posizione
  if (currentProfile) {
    const idx = filteredUsers.findIndex(u => u.username === currentProfile.username);
    if (idx > 0) {
      const [me] = filteredUsers.splice(idx, 1);
      filteredUsers = [me, ...filteredUsers];
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(12, 16, 20, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#212328] rounded-xl w-[400px] max-w-[90vw] overflow-hidden flex flex-col"
        style={{ maxHeight: '600px', minHeight: '400px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con X chiusura */}
        <div
          className="relative flex items-center justify-center border-b border-[rgb(219,223,228)] dark:border-[rgb(43,48,54)]"
        >
          <h2 
            className="text-center w-full text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)] py-3"
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              lineHeight: '20px',
              display: 'block',
              textAlign: 'center',
              cursor: 'auto',
              direction: 'ltr',
              textSizeAdjust: '100%',
              unicodeBidi: 'isolate',
              pointerEvents: 'all',
            }}
          >
            {type === 'followers' ? 'Follower' : 'Chi segui'}
          </h2>
          <div className="absolute right-6 top-1/2 -translate-y-1/2">
            <button 
              type="button" 
              tabIndex={0} 
              onClick={onClose} 
              className="text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]"
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                height: '20px',
                lineHeight: '20px',
                display: 'block',
                textAlign: 'center',
                cursor: 'auto',
                direction: 'ltr',
                textSizeAdjust: '100%',
                unicodeBidi: 'isolate',
                pointerEvents: 'all',
              }}
            >
              <div>
                <svg aria-label="Chiudi" fill="currentColor" height="18" role="img" viewBox="0 0 24 24" width="18" className="text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]">
                  <title>Chiudi</title>
                  <polyline fill="none" points="20.643 3.357 12 12 3.353 20.647" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></polyline>
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" x1="20.649" x2="3.354" y1="20.649" y2="3.354"></line>
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 relative">
          <input
            type="text"
            placeholder=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(37,41,46)' : 'rgb(243,245,247)';
            }}
            onBlur={(e) => {
              setIsFocused(false);
              e.target.style.backgroundColor = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'rgb(54,54,54)' : 'rgb(239,239,239)';
            }}
            className="appearance-none border-none rounded-[25px] box-border text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)] text-sm font-normal h-8 px-4 py-2 w-full outline-none bg-[rgb(239,239,239)] dark:bg-[rgb(54,54,54)]"
          />
          {searchQuery === '' && (
            <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
              {!isFocused && (
                <svg aria-label="Cerca" fill="currentColor" height="16" role="img" viewBox="0 0 24 24" width="16" className="text-[rgb(142,142,142)] dark:text-[rgb(248,249,249)]">
                  <title>Cerca</title>
                  <path d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5 Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  <line fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" x1="16.511" x2="22" y1="16.511" y2="22"></line>
                </svg>
              )}
              <span className="text-xs text-[rgb(142,142,142)] dark:text-[rgb(248,249,249)]">Cerca</span>
            </div>
          )}
          {/* Clear button */}
          {searchQuery !== '' && (
            <div
              className="absolute right-8 top-1/2 -translate-y-1/2 cursor-pointer text-[rgb(248,249,249)] dark:text-[rgb(12,16,20)]"
              aria-disabled="false"
              aria-label="Cancella la casella di ricerca"
              role="button"
              tabIndex={0}
              onClick={() => setSearchQuery('')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSearchQuery('');
                }
              }}
            >
              <svg aria-label="Cancella" fill="currentColor" height="14" role="img" viewBox="0 0 24 24" width="14" className="text-[rgb(12,16,20)] dark:text-[rgb(248,249,249)]">
                <title>Cancella</title>
                <path d="M12.001.504c-6.34 0-11.5 5.16-11.5 11.5s5.16 11.5 11.5 11.5 11.5-5.158 11.5-11.5-5.16-11.5-11.5-11.5Zm4.707 14.793a1 1 0 1 1-1.414 1.414l-3.293-3.293-3.293 3.293a.997.997 0 0 1-1.414 0 1 1 0 0 1 0-1.414l3.293-3.293-3.293-3.293a1 1 0 1 1 1.414-1.414l3.293 3.293 3.293-3.293a1 1 0 1 1 1.414 1.414l-3.293 3.293 3.293 3.293Z"></path>
              </svg>
            </div>
          )}
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto modal-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Caricamento...
            </div>
          ) : filteredUsers.length === 0 && searchQuery ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nessun risultato trovato.
            </div>
          ) : (
            <>
              {/* Lista follower/following */}
              {filteredUsers.map((user) => {
                const isCurrentUser = currentProfile && user.username === currentProfile.username;
                let actionButtons = null;
                if (!isCurrentUser) {
                  if (isOwnProfile && type === 'following') {
                    actionButtons = <>
                      {user.isPending && (
                        <button
                          className="btn-instagram-pending"
                          onClick={() => handleUnfollow(user.id)}
                        >
                          Richiesta effettuata
                        </button>
                      )}
                      {!user.isPending && user.is_following && (
                        <button
                          className="btn-instagram-secondary"
                          onClick={() => handleUnfollow(user.id)}
                        >
                          Segui già
                        </button>
                      )}
                      {!user.isPending && !user.is_following && (
                        <button
                          className="btn-instagram-primary"
                          onClick={() => handleFollow(user.id)}
                        >
                          Segui
                        </button>
                      )}
                    </>;
                  } else if (isOwnProfile && type === 'followers') {
                    actionButtons = (
                      <button
                        className={removedUsers.has(user.id) ? "btn-removed" : "btn-instagram-secondary"}
                        onClick={() => handleUnfollow(user.id)}
                        disabled={removedUsers.has(user.id)}
                      >
                        {removedUsers.has(user.id) ? 'Rimosso' : 'Rimuovi'}
                      </button>
                    );
                  } else if (!isOwnProfile) {
                    actionButtons = <>
                      {!user.is_following && !user.isPending && (
                        <button
                          className="btn-instagram-primary"
                          onClick={() => handleFollow(user.id)}
                        >
                          Segui
                        </button>
                      )}
                      {user.isPending && (
                        <button
                          className="btn-instagram-pending"
                          onClick={() => handleUnfollow(user.id)}
                        >
                          Richiesta effettuata
                        </button>
                      )}
                      {user.is_following && !user.isPending && (
                        <button
                          className="btn-instagram-secondary"
                          onClick={() => handleUnfollow(user.id)}
                        >
                          Segui già
                        </button>
                      )}
                    </>;
                  }
                }
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-4 py-2"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Link
                        href={`/profile/${user.username}`}
                        onClick={onClose}
                        className="flex-shrink-0"
                      >
                        <div
                          className="rounded-full flex-shrink-0 relative"
                          style={{
                            width: '44px',
                            height: '44px',
                            border: '0px solid rgba(43, 48, 54, 0.8)',
                            backgroundColor: 'rgb(243, 245, 247)',
                            overflow: 'hidden',
                          }}
                        >
                          <Image
                            src={getMediaUrl(user.profile_image_url) || '/images/default-pfp.jpg'}
                            alt={user.username}
                            width={44}
                            height={44}
                            className="rounded-full object-cover w-full h-full"
                          />
                        </div>
                      </Link>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/profile/${user.username}`}
                            onClick={onClose}
                            className="font-semibold text-sm text-instagram-primary truncate hover:opacity-70"
                          >
                            {user.username}
                          </Link>
                          {user.is_verified && (
                            <svg aria-label="Verificato" fill="rgb(0, 149, 246)" height="12" role="img" viewBox="0 0 40 40" width="12" className="flex-shrink-0">
                              <title>Verificato</title>
                              <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                            </svg>
                          )}
                          {type === 'followers' && isOwnProfile && !user.is_following && !user.isPending && (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleFollow(user.id);
                              }}
                              style={{
                                display: 'block',
                                color: 'rgb(65, 80, 247)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                                fontSize: '12px',
                                fontWeight: 600,
                                height: '16px',
                                lineHeight: '16px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                textAlign: 'center',
                                marginTop: '-2px',
                                marginBottom: '-3px',
                              }}
                            >
                              · Segui
                            </span>
                          )}
                        </div>
                        {user.full_name && (
                          <span className="text-gray-500 text-sm truncate">
                            {user.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {actionButtons}
                    </div>
                  </div>
                );
              })}

              {/* Suggeriti per te - solo nella modale follower */}
              {type === 'followers' && !searchQuery && suggestedUsers.length > 0 && (
                <>
                  <div className="px-4 py-3">
                    <h3 className="font-semibold text-sm text-instagram-primary">
                      <span
                        className="block font-semibold font-sans text-[16px] leading-5 h-[13px] text-[rgb(12,16,20)] dark:text-[rgb(250,250,250)] relative max-w-full min-w-0 break-words overflow-visible p-0 m-0 pointer-events-auto select-text"
                        style={{
                          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                          boxSizing: 'border-box',
                        }}
                      >
                        Suggeriti per te
                      </span>
                    </h3>
                  </div>
                  {suggestedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Link
                          href={`/profile/${user.username}`}
                          onClick={onClose}
                          className="flex-shrink-0"
                        >
                          <div
                            className="rounded-full flex-shrink-0 relative"
                            style={{
                              width: '44px',
                              height: '44px',
                              border: '0px solid rgba(43, 48, 54, 0.8)',
                              backgroundColor: 'rgb(243, 245, 247)',
                              overflow: 'hidden',
                            }}
                          >
                            <Image
                              src={getMediaUrl(user.profile_image_url) || '/images/default-pfp.jpg'}
                              alt={user.username}
                              width={44}
                              height={44}
                              className="rounded-full object-cover w-full h-full"
                            />
                          </div>
                        </Link>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/profile/${user.username}`}
                              onClick={onClose}
                              className="font-semibold text-sm text-instagram-primary truncate hover:opacity-70"
                            >
                              {user.username}
                            </Link>
                            {user.is_verified && (
                              <svg aria-label="Verificato" fill="rgb(0, 149, 246)" height="12" role="img" viewBox="0 0 40 40" width="12" className="flex-shrink-0">
                                <title>Verificato</title>
                                <path d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Zm7.415 11.225 2.254 2.287-11.43 11.5-6.835-6.93 2.244-2.258 4.587 4.581 9.18-9.18Z" fillRule="evenodd"></path>
                              </svg>
                            )}
                          </div>
                          {user.full_name && (
                            <span className="text-gray-500 text-sm truncate">
                              {user.full_name}
                            </span>
                          )}
                          {user.mutual_followers && user.mutual_followers.length > 0 ? (
                            <span className="text-gray-400 text-xs truncate">
                              Follower: {user.mutual_followers[0].username}
                              {user.mutual_count && user.mutual_count > 1 && ` + altri ${user.mutual_count - 1}`}
                            </span>
                          ) : user.followers_count !== undefined ? (
                            <span className="text-gray-400 text-xs truncate">
                              Follower: {user.followers_count}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Pulsante Segui/Richiesta/Segui già - stessa logica di "Chi segui" */}
                      <div className="flex items-center gap-2">
                        {user.isPending && (
                          <button
                            className="btn-instagram-pending"
                            onClick={() => handleUnfollow(user.id, true)}
                          >
                            Richiesta effettuata
                          </button>
                        )}
                        {!user.isPending && user.is_following && (
                          <button
                            className="btn-instagram-secondary"
                            onClick={() => handleUnfollow(user.id, true)}
                          >
                            Segui già
                          </button>
                        )}
                        {!user.isPending && !user.is_following && (
                          <button
                            className="btn-instagram-primary"
                            onClick={() => handleFollow(user.id)}
                          >
                            Segui
                          </button>
                        )}
                      </div>
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
