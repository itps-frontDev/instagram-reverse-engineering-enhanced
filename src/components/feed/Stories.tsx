/**
 * @fileoverview Componente Stories (Storie).
 * 
 * Carousel orizzontale con le storie degli utenti seguiti (escluse le tue).
 * Funzionamento:
 * - Carica storie SOLO da profili che segui (non include le tue storie)
 * - Visualizza un'anteprima per ogni profilo (prima storia)
 * - Clic su una storia apre il visualizzatore fullscreen
 * - Le visualizzazioni vengono registrate quando apri una storia
 * 
 * Accesso: Solo utenti autenticati possono vedere le storie
 * Mostra: Storie di profili seguiti (escluso le proprie)
 */

'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import StoryViewer from './StoryViewer';

interface StoryItem {
  id: number;
  profile_id: number;
  username: string;
  profile_image_url: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number;
  views_count: number;
  created_at: string;
  expires_at: string;
}

export default function Stories() {
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<number>();
  const storiesPerPage = 6;

  // Fetch stories from API
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/stories');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          // Group stories by profile - take only first story per profile for carousel
          const storyMap = new Map<number, StoryItem>();
          (data.stories || []).forEach((story: StoryItem) => {
            if (!storyMap.has(story.profile_id)) {
              storyMap.set(story.profile_id, story);
            }
          });
          setStories(Array.from(storyMap.values()));
        } else {
          setStories([]);
        }
      } catch (e) {
        console.error('Failed to fetch stories:', e);
        setStories([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const totalPages = Math.ceil(stories.length / storiesPerPage);
  const startIndex = currentPage * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const visibleStories = stories.slice(startIndex, endIndex);

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

  const handleStoryClick = (story: StoryItem) => {
    setSelectedUsername(story.username);
    setSelectedStoryId(story.id);
  };

  const handleCloseViewer = () => {
    setSelectedUsername(null);
    setSelectedStoryId(undefined);
  };

  if (loading || stories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-[var(--bg-primary)] rounded-lg py-4 px-2 mb-6 relative group">
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
          <div className="flex gap-4 justify-start">
            {visibleStories.map((item) => (
              <button
                key={item.id}
                onClick={() => handleStoryClick(item)}
                className="flex flex-col items-center gap-2 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                {/* Story Avatar with Gradient Border */}
                <div className="relative group/story">
<<<<<<< Updated upstream
                  <div className="w-[82px] h-[82px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2.5px] cursor-pointer">
=======
                  <div className="w-[82px] h-[82px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[2.5px] cursor-pointer hover:scale-110 transition-transform">
>>>>>>> Stashed changes
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
                </div>

                {/* Username */}
                <span className="text-xs truncate w-[82px] text-center text-[var(--text-primary)] font-normal">
                  {item.username}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Page indicator dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1 mt-3">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`h-1 rounded-full transition-all ${
                  i === currentPage
                    ? 'bg-blue-500 w-6'
                    : 'bg-gray-300 dark:bg-gray-600 w-2'
                }`}
                aria-label={`Pagina ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      {selectedUsername && (
        <StoryViewer
          profileUsername={selectedUsername}
          onClose={handleCloseViewer}
          initialStoryId={selectedStoryId}
        />
      )}
    </>
  );
}
