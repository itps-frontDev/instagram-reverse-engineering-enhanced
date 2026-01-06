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
import StoriesSkeleton from '@/components/common/skeletons/StoriesSkeleton';

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
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(0);
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
    const userIndex = stories.findIndex(s => s.username === story.username);
    setSelectedUserIndex(userIndex);
    setSelectedUsername(story.username);
    setSelectedStoryId(story.id);
  };

  const handleCloseViewer = () => {
    setSelectedUsername(null);
    setSelectedStoryId(undefined);
  };

  const handleUserChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < stories.length) {
      setSelectedUserIndex(newIndex);
      setSelectedUsername(stories[newIndex].username);
      setSelectedStoryId(stories[newIndex].id);
    } else {
      handleCloseViewer();
    }
  };

  if (loading) {
    return <StoriesSkeleton />;
  }

  if (stories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg py-4 mb-4 mt-20 lg:mt-20 pt-14 lg:pt-0 relative group w-full flex items-center justify-center">
        {/* Stories Container - centrato */}
        <div className="overflow-visible px-0 relative">
          {/* Left Arrow - sovrapposta alla prima storia */}
          {currentPage > 0 && (
            <button
              onClick={goToPreviousPage}
              className="absolute left-4 top-[35px] z-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Pagina precedente"
            >
              <ChevronLeft className="w-4 h-4 text-black" />
            </button>
          )}

          {/* Right Arrow - sovrapposta all'ultima storia */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={goToNextPage}
              className="absolute right-4 top-[35px] z-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Pagina successiva"
            >
              <ChevronRight className="w-4 h-4 text-black" />
            </button>
          )}

          <div className="flex gap-4 justify-center w-full max-[639px]:gap-2">
            {visibleStories.map((item) => (
              <button
                key={item.id}
                onClick={() => handleStoryClick(item)}
                className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                {/* Story Avatar with Gradient Border */}
                <div className="relative group/story">
                  <div className="w-[86px] h-[86px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 p-[3px] cursor-pointer transition-transform max-[639px]:w-[70px] max-[639px]:h-[70px] max-[639px]:p-[2.5px]">
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
                <span className="text-xs truncate w-[82px] text-center text-[var(--text-primary)] font-normal max-[639px]:text-[10px] max-[639px]:w-[70px]">
                  {item.username}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedUsername && (
        <StoryViewer
          profileUsername={selectedUsername}
          onClose={handleCloseViewer}
          initialStoryId={selectedStoryId}
          allUsernames={stories.map(s => s.username)}
          currentUserIndex={selectedUserIndex}
          onUserChange={handleUserChange}
        />
      )}
    </>
  );
}

