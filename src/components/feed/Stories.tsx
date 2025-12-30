/**
 * @fileoverview Componente Stories (Storie).
 * 
 * Carousel orizzontale con le storie degli utenti seguiti.
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function Stories() {
  // TODO: Fetch stories from API
  const stories = Array(20).fill(null);
  const [currentPage, setCurrentPage] = useState(0);
  const storiesPerPage = 6;
  const totalPages = Math.ceil(stories.length / storiesPerPage);

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
      <div className="overflow-hidden">
        <div className="flex gap-4">
          {visibleStories.map((_, index) => (
            <div key={startIndex + index} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-[84px] h-[84px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2.5px] cursor-pointer">
                <div className="w-full h-full rounded-full bg-white dark:bg-[#0c1014] p-[2.5px]">
                  <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
              <span className="text-xs truncate w-[84px] text-center text-[var(--text-primary)] font-normal">
                username{startIndex + index}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
