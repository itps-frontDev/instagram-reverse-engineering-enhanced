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
import ProfilePicture from '@/components/ProfilePicture';

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
  is_viewed?: number;
}

interface ProfileStories {
  profile_id: number;
  username: string;
  profile_image_url: string | null;
  stories: StoryItem[];
  allViewed: boolean;
}

export default function Stories() {
  const [profileStories, setProfileStories] = useState<ProfileStories[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);
  const [selectedStoryId, setSelectedStoryId] = useState<number>();
  const [selectedUserIndex, setSelectedUserIndex] = useState<number>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const storiesPerPage = isMobile ? 4 : 6;

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
          
          // Group stories by profile
          const profileMap = new Map<number, ProfileStories>();
          (data.stories || []).forEach((story: StoryItem) => {
            if (!profileMap.has(story.profile_id)) {
              profileMap.set(story.profile_id, {
                profile_id: story.profile_id,
                username: story.username,
                profile_image_url: story.profile_image_url,
                stories: [],
                allViewed: true
              });
            }
            const profile = profileMap.get(story.profile_id)!;
            profile.stories.push(story);
            // Se anche una sola storia non è vista, allViewed = false
            if (!story.is_viewed) {
              profile.allViewed = false;
            }
          });

          // Converti in array e ordina: non viste prima, viste dopo
          const profilesArray = Array.from(profileMap.values());
          profilesArray.sort((a, b) => {
            if (a.allViewed === b.allViewed) return 0;
            return a.allViewed ? 1 : -1; // Non viste prima
          });

          setProfileStories(profilesArray);
        } else {
          setProfileStories([]);
        }
      } catch (e) {
        console.error('Failed to fetch stories:', e);
        setProfileStories([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const totalPages = Math.ceil(profileStories.length / storiesPerPage);
  const startIndex = currentPage * storiesPerPage;
  const endIndex = startIndex + storiesPerPage;
  const visibleProfiles = profileStories.slice(startIndex, endIndex);

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

  const handleStoryClick = (profile: ProfileStories) => {
    const userIndex = profileStories.findIndex(p => p.username === profile.username);
    setSelectedUserIndex(userIndex);
    setSelectedUsername(profile.username);
    setSelectedStoryId(profile.stories[0].id);
  };

  const handleCloseViewer = () => {
    setSelectedUsername(null);
    setSelectedStoryId(undefined);
  };

  const handleUserChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < profileStories.length) {
      setSelectedUserIndex(newIndex);
      setSelectedUsername(profileStories[newIndex].username);
      setSelectedStoryId(profileStories[newIndex].stories[0].id);
    } else {
      handleCloseViewer();
    }
  };

  // Aggiorna stato locale delle storie dopo la visualizzazione
  const handleStoriesViewed = (profileId: number) => {
    // Deferisci l'aggiornamento dello stato al prossimo tick per evitare errori React
    setTimeout(() => {
      setProfileStories((prev) => {
        return prev.map((profile) => {
          if (profile.profile_id === profileId) {
            // Marca tutte le storie come viste
            const updatedStories = profile.stories.map((s) => ({ ...s, is_viewed: 1 }));
            return {
              ...profile,
              stories: updatedStories,
              allViewed: true
            };
          }
          return profile;
        });
      });
    }, 0);
  };

  if (loading) {
    return <StoriesSkeleton />;
  }

  if (profileStories.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rounded-lg py-2 mb-4 mt-15 pt-2 relative group w-full flex items-center justify-center max-[639px]:px-2">
        {/* Stories Container - centrato */}
        <div className="overflow-visible px-0 relative w-full">
          {/* Left Arrow - sovrapposta alla prima storia */}
          {currentPage > 0 && (
            <button
              onClick={goToPreviousPage}
              className="absolute left-2 top-[35px] z-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 max-[639px]:opacity-100 transition-opacity cursor-pointer max-[639px]:left-0 max-[639px]:w-5 max-[639px]:h-5"
              aria-label="Pagina precedente"
            >
              <ChevronLeft className="w-4 h-4 text-black max-[639px]:w-3 max-[639px]:h-3" />
            </button>
          )}

          {/* Right Arrow - sovrapposta all'ultima storia */}
          {currentPage < totalPages - 1 && (
            <button
              onClick={goToNextPage}
              className="absolute right-2 top-[35px] z-20 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 max-[639px]:opacity-100 transition-opacity cursor-pointer max-[639px]:right-0 max-[639px]:w-5 max-[639px]:h-5"
              aria-label="Pagina successiva"
            >
              <ChevronRight className="w-4 h-4 text-black max-[639px]:w-3 max-[639px]:h-3" />
            </button>
          )}

          <div className="flex gap-4 justify-center w-full max-[639px]:gap-3 max-[639px]:px-6">
            {visibleProfiles.map((profile) => (
              <button
                key={profile.profile_id}
                onClick={() => handleStoryClick(profile)}
                className="flex flex-col items-center gap-1 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg"
              >
                {/* Story Avatar with Gradient Border */}
                <div className="relative group/story">
                  <div 
                    className={`w-[86px] h-[86px] rounded-full p-[3px] cursor-pointer transition-transform max-[639px]:w-[90px] max-[639px]:h-[90px] max-[639px]:p-[2.5px] ${
                      profile.allViewed 
                        ? 'bg-gray-300 dark:bg-gray-600' 
                        : 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
                    }`}
                  >
                    <div className="w-full h-full rounded-full bg-white dark:bg-[#0c1014] flex items-center justify-center">
                      <div className="w-[75px] h-[75px] max-[639px]:w-[80px] max-[639px]:h-[80px]">
                        <ProfilePicture
                          src={profile.profile_image_url}
                          alt={profile.username}
                          size={window.innerWidth < 640 ? 80 : 75}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <span className="text-xs truncate w-[82px] text-center text-[var(--text-primary)] font-normal max-[639px]:text-[11px] max-[639px]:w-[90px]">
                  {profile.username}
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
          allUsernames={profileStories.map(p => p.username)}
          currentUserIndex={selectedUserIndex}
          onUserChange={handleUserChange}
          onAllStoriesViewed={(profileId) => handleStoriesViewed(profileId)}
        />
      )}
    </>
  );
}

