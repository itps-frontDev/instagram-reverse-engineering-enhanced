/**
 * @fileoverview Componente Stories (Storie).
 * 
 * Carousel orizzontale con le storie degli utenti seguiti.
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

interface StoryItem {
  id: number;
  username: string;
  profile_image_url: string | null;
}

export default function Stories() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const storiesPerPage = 6;
  const totalPages = Math.ceil(stories.length / storiesPerPage);

  // Fetch demo stories (reusing suggestions endpoint for profile data)
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/profiles/suggestions');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          const items = (data.profiles || []).slice(0, 18).map((u: any, i: number) => ({
            id: u.id ?? i,
            username: u.username ?? `user${i}`,
            profile_image_url: u.profile_image_url ?? null,
          }));
          setStories(items);
        } else {
          // fallback to placeholders
          setStories(Array.from({ length: 12 }).map((_, i) => ({ id: i, username: `user${i}`, profile_image_url: null })));
        }
      } catch (e) {
        setStories(Array.from({ length: 12 }).map((_, i) => ({ id: i, username: `user${i}`, profile_image_url: null })));
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Calculate which stories to show
  const startIndex = currentPage * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const visibleStories = stories.slice(startIndex, endIndex);

  // Navigate pages
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-lg p-4 mb-6 relative group">
      {/* Left Arrow */}
      {currentPage > 0 && (
        <button
          onClick={goToPreviousPage}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-[#262626] rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Pagina precedente"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      )}

      {/* Right Arrow */}
      {currentPage < totalPages - 1 && (
        <button
          onClick={goToNextPage}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white dark:bg-[#262626] rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Pagina successiva"
        >
          <ChevronRight className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
      )}

      {/* Stories Container */}
      <div className="overflow-hidden pl-8 pr-14">
        <div className="flex gap-[20px] justify-start">
          {visibleStories.map((item, index) => (
            <div key={startIndex + index} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-[82px] h-[82px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2.5px] cursor-pointer hover:scale-105 transition-transform">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#0c1014] p-[2.5px]">
                  {item.profile_image_url ? (
                    <img
                      src={item.profile_image_url}
                      alt={item.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-white font-semibold">
                      {item.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs truncate w-[82px] text-center text-[var(--text-primary)] font-normal">
                {item.username}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
