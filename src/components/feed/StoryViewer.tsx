/**
 * @fileoverview Componente StoryViewer (Visualizzatore Storie).
 * 
 * Modal fullscreen per visualizzare le storie di un profilo.
 * Funzionamento:
 * - Mostra tutte le storie di un profilo sequenzialmente
 * - Progress bar animata per ogni storia
 * - Auto-advance alla prossima storia quando scade il timer
 * - Registra le visualizzazioni via POST /api/stories/:id/view
 * - Naviga con frecce o tastiera (ArrowLeft/ArrowRight)
 * 
 * Restrizioni:
 * - Accesso solo se segui il profilo o è la tua storia
 * - Le visualizzazioni contano solo la prima volta che vedi una storia
 */

'use client';

import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface Story {
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

interface StoryViewerProps {
  profileUsername: string;
  onClose: () => void;
  initialStoryId?: number;
}

export default function StoryViewer({
  profileUsername,
  onClose,
  initialStoryId,
}: StoryViewerProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const autoPauseTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch stories for the profile
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/api/stories');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          // Filter stories by profile username
          const profileStories = (data.stories || [])
            .filter((s: Story) => s.username === profileUsername)
            .sort((a: Story, b: Story) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          
          setStories(profileStories);
          
          // Find initial story index
          if (initialStoryId && profileStories.length > 0) {
            const idx = profileStories.findIndex(s => s.id === initialStoryId);
            setCurrentIndex(idx >= 0 ? idx : 0);
          }
        }
      } catch (e) {
        console.error('Failed to fetch stories:', e);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => { mounted = false; };
  }, [profileUsername, initialStoryId]);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.duration_seconds || 5;

  // Record view when story changes
  useEffect(() => {
    if (!currentStory) return;

    async function recordView() {
      try {
        await fetch(`/api/stories/${currentStory.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (e) {
        console.error('Failed to record story view:', e);
      }
    }

    recordView();
  }, [currentStory?.id]);

  // Handle auto-advance to next story
  useEffect(() => {
    if (!currentStory || loading) return;

    // Clear existing interval and timeout
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (autoPauseTimeoutRef.current) clearTimeout(autoPauseTimeoutRef.current);

    // Start progress animation
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + (100 / (duration * 10)); // 10ms interval for smooth animation
      });
    }, 10);

    // Auto-advance when story ends
    autoPauseTimeoutRef.current = setTimeout(() => {
      if (currentIndex < stories.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    }, duration * 1000);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (autoPauseTimeoutRef.current) clearTimeout(autoPauseTimeoutRef.current);
    };
  }, [currentStory, currentIndex, stories.length, duration, loading, onClose]);

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onClose();
    }
  }, [currentIndex, onClose]);

  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext, onClose]);

  if (loading || !currentStory) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Caricamento storia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-100 z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-all z-10"
        aria-label="Chiudi"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Progress bars container */}
      <div className="absolute top-0 left-0 right-0 px-2 py-2 z-10 flex gap-1">
        {stories.map((_, idx) => (
          <div
            key={idx}
            className="flex-1 h-0.5 bg-gray-500 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-white transition-all"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
              }}
            />
          </div>
        ))}
      </div>

      {/* Story header - Profile info */}
      <div className="absolute top-12 left-4 right-4 flex items-center gap-3 z-10">
        {currentStory.profile_image_url ? (
          <img
            src={currentStory.profile_image_url}
            alt={currentStory.username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
            {currentStory.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <p className="text-white font-semibold text-sm">{currentStory.username}</p>
          <p className="text-gray-300 text-xs">
            {new Date(currentStory.created_at).toLocaleTimeString('it-IT', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      {/* Story content */}
      <div className="relative w-full max-w-md aspect-[9/16] overflow-hidden rounded-2xl">
        {currentStory.media_type === 'image' ? (
          <img
            ref={imageRef}
            src={currentStory.media_url}
            alt="storia"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="w-full h-full object-cover"
            autoPlay
            muted={isMuted}
          />
        )}

        {/* Mute button for videos */}
        {currentStory.media_type === 'video' && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            aria-label={isMuted ? 'Abilita audio' : 'Disabilita audio'}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Views counter */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 text-white px-3 py-2 rounded-full text-sm">
          <Eye className="w-4 h-4" />
          <span>{currentStory.views_count}</span>
        </div>
      </div>

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition-all"
          aria-label="Storia precedente"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < stories.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white hover:bg-opacity-20 p-3 rounded-full transition-all"
          aria-label="Storia successiva"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Story counter at bottom */}
      <div className="absolute bottom-4 text-white text-center text-sm">
        {currentIndex + 1} / {stories.length}
      </div>
    </div>
  );
}
