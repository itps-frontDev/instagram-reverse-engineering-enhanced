/**
 * @fileoverview Pagina Ricerca.
 * 
 * Ricerca di utenti, hashtag e luoghi.
 */

'use client';

import { Search as SearchIcon } from 'lucide-react';
import { useState } from 'react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      {/* Search Bar */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Cerca"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg outline-none focus:bg-gray-200"
        />
      </div>

      {/* Results Tabs */}
      <div className="flex gap-8 border-b border-gray-200 mb-6">
        <button className="pb-3 font-semibold border-b-2 border-black">
          Account
        </button>
        <button className="pb-3 text-gray-400">
          Hashtag
        </button>
        <button className="pb-3 text-gray-400">
          Luoghi
        </button>
      </div>

      {/* Search Results */}
      <div className="space-y-3">
        {query ? (
          // Results when searching
          Array(5).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 hover:bg-gray-50 px-3 rounded cursor-pointer">
              <div className="w-11 h-11 rounded-full bg-gray-200" />
              <div className="flex-1">
                <p className="font-semibold">username{i}</p>
                <p className="text-sm text-gray-500">Nome Completo • Segui già</p>
              </div>
            </div>
          ))
        ) : (
          // Recents when not searching
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recenti</h2>
              <button className="text-sm text-blue-500 font-semibold">
                Cancella tutto
              </button>
            </div>
            <p className="text-sm text-gray-500 text-center py-8">
              Nessuna ricerca recente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
