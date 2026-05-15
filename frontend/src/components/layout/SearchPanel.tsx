/**
 * @fileoverview Pannello laterale di ricerca.
 * 
 * Pannello che si apre dalla sidebar per cercare utenti, hashtag e luoghi.
 * 
 * FUNZIONALITÀ:
 * - Input ricerca con debounce
 * - Tab: Account, Hashtag, Luoghi
 * - Risultati con avatar e info utente
 * - Ricerche recenti con persistenza localStorage
 * - Rimozione singola o totale recenti
 * - Skeleton loading durante ricerca
 * - Chiusura con ESC o click esterno
 * 
 * @module components/layout/SearchPanel
 */

'use client';

import { Search as SearchIcon, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {ProfilePicture} from '@/components';
import { LoadingSpinner, VerifiedBadge } from '@/components/common';
import { searchProfilesAction } from '@/features/search/actions';
import type { SearchAccountResult } from '@/features/search/schema';
import Link from 'next/link';

function isRecentSearch(value: unknown): value is SearchAccountResult {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.uuid === 'string' &&
    typeof candidate.username === 'string' &&
    typeof candidate.isVerified === 'boolean' &&
    typeof candidate.isPrivate === 'boolean' &&
    typeof candidate.followersCount === 'number' &&
    typeof candidate.isFollowing === 'boolean'
  );
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'account' | 'hashtag' | 'luoghi'>('account');
  const [results, setResults] = useState<SearchAccountResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchAccountResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshRecentFollowStates = async (items: SearchAccountResult[]): Promise<SearchAccountResult[]> => {
    // Aggiorna lo stato follow dai dati backend per evitare stato stale nei recenti.
    const refreshed = await Promise.all(
      items.map(async (item) => {
        try {
          const actionResult = await searchProfilesAction({
            q: item.username,
            type: 'account',
            limit: 5,
          });

          if (!actionResult.success) {
            return item;
          }

          const exactMatch = actionResult.data.results.find(
            (result) =>
              result.uuid === item.uuid ||
              result.username.toLowerCase() === item.username.toLowerCase()
          );

          return exactMatch ? { ...item, isFollowing: exactMatch.isFollowing } : item;
        } catch {
          return item;
        }
      })
    );

    return refreshed;
  };

  // Detect when mounted on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Carica ricerche recenti da localStorage
  useEffect(() => {
    if (!isOpen) return;
    
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const validRecentSearches = parsed.filter(isRecentSearch);
          setRecentSearches(validRecentSearches);

          // Sincronizza lo stato follow con il backend ad ogni apertura pannello.
          void refreshRecentFollowStates(validRecentSearches).then((updatedRecentSearches) => {
            setRecentSearches(updatedRecentSearches);
            localStorage.setItem('recentSearches', JSON.stringify(updatedRecentSearches));
          });
        }
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, [isOpen]);

  // Salva una ricerca nei recenti
  const saveToRecent = (result: SearchAccountResult) => {
    const updated = [
      result,
      ...recentSearches.filter(r => r.uuid !== result.uuid)
    ].slice(0, 10); // Mantieni solo le ultime 10
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Rimuovi una ricerca dai recenti
  const removeFromRecent = (uuid: string) => {
    const updated = recentSearches.filter(r => r.uuid !== uuid);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Cancella tutte le ricerche recenti
  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Chiudi il pannello quando si preme ESC
  useEffect(() => {
    if (!isOpen) return;
    
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Ricerca con debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const actionResult = await searchProfilesAction({
          q: query,
          type: activeTab,
          limit: 20,
        });
        if (actionResult.success) {
          setResults(actionResult.data.results);
        } else {
          console.error('Search action error:', actionResult.error);
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, activeTab]);

  return (
    <div
      ref={panelRef}
      className={`fixed left-0 top-0 h-screen bg-[var(--bg-primary)] border-r border-[#DBDBDB] dark:border-[#262626] transition-all duration-300 ease-in-out overflow-hidden z-40 rounded-r-2xl ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'
      }`}
      style={{
        width: isOpen ? (mounted && window.innerWidth < 640 ? '100vw' : '397px') : '0px',
        marginLeft: mounted && window.innerWidth >= 640 ? '80px' : '0px',
        boxShadow: isOpen ? '4px 0px 24px 0px rgba(0, 0, 0, 0.15)' : 'none',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6">
          <h2 className="text-2xl font-semibold text-[#262626] dark:text-white mb-6">Cerca</h2>
          
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E] transition-opacity ${isFocused ? 'opacity-0' : 'opacity-100'}`} />
            <input
              type="text"
              placeholder="Cerca"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full h-[40px] pr-10 py-2 bg-[rgb(243,245,247)] dark:bg-[rgb(37,41,46)] border-none rounded-[25px] outline-none text-[#262626] dark:text-white placeholder-[#8E8E8E] text-base transition-all ${isFocused ? 'pl-4' : 'pl-10'}`}
              autoFocus
            />
            {query !== '' && (
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                aria-disabled="false"
                aria-label="Cancella la casella di ricerca"
                role="button"
                tabIndex={0}
                onClick={() => setQuery('')}
                onMouseDown={(e) => e.preventDefault()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setQuery('');
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
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {query ? (
            // Risultati della ricerca
            <div>
              {/* Tabs */}
              <div className="flex gap-8 px-6 pt-4 border-b border-[#DBDBDB] dark:border-[#262626]">
                <button
                  onClick={() => setActiveTab('account')}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'account'
                      ? 'text-[#262626] dark:text-white border-b border-[#262626] dark:border-white'
                      : 'text-[#8E8E8E]'
                  }`}
                >
                  Account
                </button>
                <button
                  onClick={() => setActiveTab('hashtag')}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'hashtag'
                      ? 'text-[#262626] dark:text-white border-b border-[#262626] dark:border-white'
                      : 'text-[#8E8E8E]'
                  }`}
                >
                  Hashtag
                </button>
                <button
                  onClick={() => setActiveTab('luoghi')}
                  className={`pb-3 text-sm font-semibold transition-colors ${
                    activeTab === 'luoghi'
                      ? 'text-[#262626] dark:text-white border-b border-[#262626] dark:border-white'
                      : 'text-[#8E8E8E]'
                  }`}
                >
                  Luoghi
                </button>
              </div>

              {/* Results List */}
              <div className="px-2 py-2">
                {isLoading ? (
                  // Loading skeleton
                  <div className="px-4 py-8 text-center">
                    <LoadingSpinner size={24} />
                  </div>
                ) : results.length === 0 ? (
                  // No results
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-[#8E8E8E]">
                      Nessun risultato trovato.
                    </p>
                  </div>
                ) : (
                  // Results
                  activeTab === 'account' && results.map((result) => (
                    <Link
                      key={result.uuid}
                      href={`/profile/${result.username}`}
                      onClick={() => {
                        saveToRecent(result);
                        onClose();
                        setQuery('');
                      }}
                      className="flex items-center gap-3 w-full py-2 px-4 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] rounded-lg transition"
                    >
                      <ProfilePicture
                        src={result.profileImageUrl || ''}
                        alt={result.username}
                        size={44}
                      />
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-[#262626] dark:text-white text-sm truncate">
                            {result.username}
                          </p>
                          {result.isVerified && (
                            <VerifiedBadge size={12} />
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E8E] truncate">
                          {result.fullName || result.username}
                          {result.isFollowing && ' • Segui già'}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Recenti (quando non c'è ricerca)
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#262626] dark:text-white">Recenti</h3>
                {recentSearches.length > 0 && (
                  <button 
                    onClick={clearAllRecent}
                    className="text-sm text-[rgb(116,140,221)] font-semibold hover:text-[rgb(116,140,221)] dark:hover:text-[rgb(116,140,221)]"
                  >
                    Cancella tutto
                  </button>
                )}
              </div>
              
              {recentSearches.length === 0 ? (
                <div className="py-16 text-center">
                  <p className="text-sm text-[#8E8E8E]">
                    Nessuna ricerca recente.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentSearches.map((result) => (
                    <div
                      key={result.uuid}
                      className="flex items-center gap-3 w-full py-2 px-2 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] rounded-lg transition"
                    >
                      <Link
                        href={`/profile/${result.username}`}
                        onClick={() => {
                          saveToRecent(result);
                          onClose();
                        }}
                        className="flex items-center gap-3 flex-1 overflow-hidden"
                      >
                        <ProfilePicture
                          src={result.profileImageUrl || ''}
                          alt={result.username}
                          size={44}
                        />
                        <div className="flex-1 text-left overflow-hidden">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-[#262626] dark:text-white text-sm truncate">
                              {result.username}
                            </p>
                            {result.isVerified && (
                              <VerifiedBadge size={12} />
                            )}
                          </div>
                          <p className="text-xs text-[#8E8E8E] truncate">
                            {result.fullName || result.username}
                            {result.isFollowing && ' • Segui già'}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFromRecent(result.uuid)}
                        className="p-2 text-[#8E8E8E] hover:text-[#262626] dark:hover:text-white transition flex-shrink-0"
                        aria-label="Rimuovi"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
