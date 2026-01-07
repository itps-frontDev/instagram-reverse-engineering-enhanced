/**
 * @fileoverview Pannello laterale di ricerca.
 * 
 * Pannello che si apre dalla sidebar per cercare utenti, hashtag e luoghi.
 */

'use client';

import { Search as SearchIcon, X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ProfilePicture from '@/components/ProfilePicture';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import Link from 'next/link';

interface SearchResult {
  id: number;
  username: string;
  full_name: string | null;
  profile_image_url: string | null;
  is_verified: boolean;
  is_private: boolean;
  followers_count: number;
}

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchPanel({ isOpen, onClose }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'account' | 'hashtag' | 'luoghi'>('account');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading recent searches:', e);
      }
    }
  }, [isOpen]);

  // Salva una ricerca nei recenti
  const saveToRecent = (result: SearchResult) => {
    const updated = [
      result,
      ...recentSearches.filter(r => r.id !== result.id)
    ].slice(0, 10); // Mantieni solo le ultime 10
    
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Rimuovi una ricerca dai recenti
  const removeFromRecent = (id: number) => {
    const updated = recentSearches.filter(r => r.id !== id);
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
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
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
      className={`fixed left-0 top-0 h-screen bg-[var(--bg-primary)] border-r border-[#DBDBDB] dark:border-[#262626] transition-all duration-300 ease-in-out overflow-hidden z-40 ${
        isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none'
      }`}
      style={{
        width: isOpen ? (mounted && window.innerWidth < 640 ? '100vw' : '397px') : '0px',
        marginLeft: mounted && window.innerWidth >= 640 ? '80px' : '0px',
      }}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-6 border-b border-[#DBDBDB] dark:border-[#262626]">
          <h2 className="text-2xl font-semibold text-[#262626] dark:text-white mb-6">Cerca</h2>
          
          {/* Search Input */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E8E8E]" />
            <input
              type="text"
              placeholder="Cerca"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-[#EFEFEF] dark:bg-[#262626] border-none rounded-lg outline-none text-[#262626] dark:text-white placeholder-[#8E8E8E] text-sm"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8E8E] hover:text-[#262626] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
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
                    <div className="inline-block w-6 h-6 border-2 border-[#DBDBDB] border-t-[#262626] dark:border-[#262626] dark:border-t-white rounded-full animate-spin" />
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
                      key={result.id}
                      href={`/profile/${result.username}`}
                      onClick={() => {
                        saveToRecent(result);
                        onClose();
                        setQuery('');
                      }}
                      className="flex items-center gap-3 w-full py-2 px-4 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] rounded-lg transition"
                    >
                      <div className="w-11 h-11 rounded-full bg-[#DBDBDB] dark:bg-[#262626] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {result.profile_image_url ? (
                          <ProfilePicture
                            src={result.profile_image_url}
                            alt={result.username}
                            size={44}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                        )}
                      </div>
                      <div className="flex-1 text-left overflow-hidden">
                        <div className="flex items-center gap-1">
                          <p className="font-semibold text-[#262626] dark:text-white text-sm truncate">
                            {result.username}
                          </p>
                          {result.is_verified && (
                            <VerifiedBadge size={12} />
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E8E] truncate">
                          {result.full_name || result.username}
                          {result.is_private && ' • Privato'}
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
                    className="text-sm text-[#0095F6] font-semibold hover:text-[#00376B] transition"
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
                      key={result.id}
                      className="flex items-center gap-3 w-full py-2 px-2 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] rounded-lg transition group"
                    >
                      <Link
                        href={`/profile/${result.username}`}
                        onClick={() => {
                          saveToRecent(result);
                          onClose();
                        }}
                        className="flex items-center gap-3 flex-1 overflow-hidden"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#DBDBDB] dark:bg-[#262626] flex items-center justify-center overflow-hidden flex-shrink-0">
                          {result.profile_image_url ? (
                            <ProfilePicture
                              src={result.profile_image_url}
                              alt={result.username}
                              size={44}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                          )}
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                          <div className="flex items-center gap-1">
                            <p className="font-semibold text-[#262626] dark:text-white text-sm truncate">
                              {result.username}
                            </p>
                            {result.is_verified && (
                              <VerifiedBadge size={12} />
                            )}
                          </div>
                          <p className="text-xs text-[#8E8E8E] truncate">
                            {result.full_name || result.username}
                            {result.is_private && ' • Privato'}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => removeFromRecent(result.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-[#8E8E8E] hover:text-[#262626] dark:hover:text-white transition flex-shrink-0"
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
