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

import { X, ChevronLeft, ChevronRight, Volume2, VolumeX, Eye, Heart } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {ProfilePicture} from '@/components';
import { LoadingSpinner } from '@/components/common';
import {StoryViewerSkeleton} from '@/components/common/skeletons';
import { VerifiedBadge, ShareIcon } from '@/components/common';

interface Story {
  id: number;
  profile_id: number;
  username: string;
  profile_image_url: string | null;
  is_verified?: boolean;
  media_url: string;
  media_type: 'image' | 'video';
  duration_seconds: number;
  views_count: number;
  created_at: string;
  expires_at: string;
  is_liked_by_me?: boolean;
  is_viewed?: number;
}

interface StoryViewerProps {
  profileUsername: string;
  profileId?: number;
  onClose: () => void;
  initialStoryId?: number;
  allUsernames?: string[];
  currentUserIndex?: number;
  onUserChange?: (newIndex: number) => void;
  onAllStoriesViewed?: (profileId: number) => void;
}

export default function StoryViewer({
  profileUsername,
  profileId,
  onClose,
  initialStoryId,
  allUsernames = [],
  currentUserIndex = 0,
  onUserChange,
  onAllStoriesViewed,
}: StoryViewerProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [prevUserPreviews, setPrevUserPreviews] = useState<Story[]>([]);
  const [nextUserPreviews, setNextUserPreviews] = useState<Story[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [showMessageSent, setShowMessageSent] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const autoPauseTimeoutRef = useRef<number | null>(null);

  // Recupera storie per il profilo
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        let res;
        if (profileId) {
          res = await fetch(`/api/stories/${profileId}/public`);
        } else {
          res = await fetch('/api/stories');
        }
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          let profileStories;
          if (profileId) {
            profileStories = data.stories || [];
          } else {
            profileStories = (data.stories || [])
              .filter((s: Story) => s.username === profileUsername)
              .sort((a: Story, b: Story) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
          }
          setStories(profileStories);
          // Trova indice storia iniziale
          if (initialStoryId && profileStories.length > 0) {
            const idx = profileStories.findIndex((s: Story) => s.id === initialStoryId);
            setCurrentIndex(idx >= 0 ? idx : 0);
            // Imposta stato like iniziale
            const initialStory = profileStories[idx >= 0 ? idx : 0];
            setIsLiked(initialStory?.is_liked_by_me || false);
          } else if (profileStories.length > 0) {
            // Imposta stato like per la prima storia se non c'è initialStoryId
            setIsLiked(profileStories[0]?.is_liked_by_me || false);
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
  }, [profileUsername, profileId, initialStoryId]);

  // Reset indice quando cambia username
  useEffect(() => {
    // Solo se stories cambia per un nuovo utente, non per update locale
    if (stories.length > 0 && currentIndex >= stories.length) {
      setCurrentIndex(0);
      setIsLiked(stories[0]?.is_liked_by_me || false);
    }
  }, [profileUsername, stories]);

  // Carica anteprime storie da altri utenti
  useEffect(() => {
    if (allUsernames.length === 0) return;

    async function loadPreviews() {
      try {
        const res = await fetch('/api/stories');
        if (res.ok) {
          const data = await res.json();
          const allStories = data.stories || [];

          // Previous users previews (up to 2)
          const prevPreviews: Story[] = [];
          for (let i = 1; i <= 2; i++) {
            if (currentUserIndex - i >= 0) {
              const prevUsername = allUsernames[currentUserIndex - i];
              const prevStory = allStories.find((s: Story) => s.username === prevUsername);
              if (prevStory) prevPreviews.push(prevStory);
            }
          }
          setPrevUserPreviews(prevPreviews);

          // Next users previews (up to 2)
          const nextPreviews: Story[] = [];
          for (let i = 1; i <= 2; i++) {
            if (currentUserIndex + i < allUsernames.length) {
              const nextUsername = allUsernames[currentUserIndex + i];
              const nextStory = allStories.find((s: Story) => s.username === nextUsername);
              if (nextStory) nextPreviews.push(nextStory);
            }
          }
          setNextUserPreviews(nextPreviews);
        }
      } catch (e) {
        console.error('Failed to load preview stories:', e);
      }
    }

    loadPreviews();
  }, [allUsernames, currentUserIndex]);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.media_type === 'image' ? 5 : (currentStory?.duration_seconds || 5);

  // Record view when story changes
  useEffect(() => {
    if (!currentStory) return;

    const firstView = !currentStory.is_viewed;
    if (!firstView) return; // Evita chiamate ripetute

    // Funzione asincrona per registrare la visualizzazione
    async function recordView() {
      try {
        await fetch(`/api/stories/${currentStory.id}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        // Aggiorna lo stato della storia come vista
        setStories((prevStories) => {
          const updated = [...prevStories];
          if (updated[currentIndex]) {
            updated[currentIndex] = {
              ...updated[currentIndex],
              is_viewed: 1
            };
          }
          // Se tutte le storie sono ora viste, notifica il container
          // Usa setTimeout per deferire l'aggiornamento dello stato al prossimo tick
          if (onAllStoriesViewed && updated.every(s => s.is_viewed)) {
            setTimeout(() => {
              onAllStoriesViewed(updated[0].profile_id);
            }, 0);
          }
          return updated;
        });
      } catch (e) {
        console.error('Failed to record story view:', e);
      }
    }

    recordView();
  }, [currentStory, currentIndex, onAllStoriesViewed]);

  // Funzione ritorno alla storia precedente
  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Aggiorna stato like per la nuova storia
      const prevStory = stories[currentIndex - 1];
      setIsLiked(prevStory?.is_liked_by_me || false);
    } else {
      // Prima storia di questo utente
      if (allUsernames.length > 0 && onUserChange && currentUserIndex > 0) {
        // Attiva transizione verso destra
        setIsTransitioning(true);
        setTransitionDirection('right');
        // Cambia utente alla fine della transizione
        setTimeout(() => {
          onUserChange(currentUserIndex - 1);
          // Attiva fase di ritorno
          setIsReturning(true);
          setIsTransitioning(false);
          // Dopo un frame, disattiva ritorno per animare verso centro
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsReturning(false);
              setTransitionDirection(null);
            });
          });
        }, 150);
      } else {
        // Chiudi se non ci sono utenti precedenti
        onClose();
      }
    }
  }, [currentIndex, allUsernames.length, currentUserIndex, onUserChange, onClose]);

  // Funzione avanzamento alla storia successiva
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Aggiorna stato like per la nuova storia
      const nextStory = stories[currentIndex + 1];
      setIsLiked(nextStory?.is_liked_by_me || false);
    } else {
      // Fine delle storie di questo utente
      if (allUsernames.length > 0 && onUserChange && currentUserIndex < allUsernames.length - 1) {
        // Attiva transizione verso sinistra
        setIsTransitioning(true);
        setTransitionDirection('left');
        // Cambia utente alla fine della transizione
        setTimeout(() => {
          onUserChange(currentUserIndex + 1);
          // Attiva fase di ritorno
          setIsReturning(true);
          setIsTransitioning(false);
          // Dopo un frame, disattiva ritorno per animare verso centro
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsReturning(false);
              setTransitionDirection(null);
            });
          });
        }, 150);
      } else {
        // Chiudi se non ci sono altri utenti
        onClose();
      }
    }
  }, [currentIndex, stories.length, allUsernames.length, currentUserIndex, onUserChange, onClose]);

  // Salta direttamente al profilo specificato (cliccando freccia, non scrollando le storie)
  const goToProfileByIndex = useCallback((targetUserIndex: number, direction: 'left' | 'right') => {
    if (onUserChange && targetUserIndex >= 0 && targetUserIndex < allUsernames.length) {
      // Attiva transizione verso la direzione specifica
      setIsTransitioning(true);
      setTransitionDirection(direction);
      // Cambia utente alla fine della transizione
      setTimeout(() => {
        onUserChange(targetUserIndex);
        // Attiva fase di ritorno
        setIsReturning(true);
        setIsTransitioning(false);
        // Dopo un frame, disattiva ritorno per animare verso centro
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsReturning(false);
            setTransitionDirection(null);
          });
        });
      }, 150);
    }
  }, [allUsernames.length, onUserChange]);

  // Salta direttamente al profilo successivo (cliccando freccia, non scrollando le storie)
  const goToNextProfile = useCallback(() => {
    if (allUsernames.length > 0 && onUserChange && currentUserIndex < allUsernames.length - 1) {
      // Attiva transizione verso sinistra
      setIsTransitioning(true);
      setTransitionDirection('left');
      // Cambia utente alla fine della transizione
      setTimeout(() => {
        onUserChange(currentUserIndex + 1);
        // Attiva fase di ritorno
        setIsReturning(true);
        setIsTransitioning(false);
        // Dopo un frame, disattiva ritorno per animare verso centro
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsReturning(false);
            setTransitionDirection(null);
          });
        });
      }, 150);
    } else {
      // Chiudi se non ci sono altri utenti
      onClose();
    }
  }, [allUsernames.length, currentUserIndex, onUserChange, onClose]);

  // Gestisce l'avanzamento automatico alla storia successiva
  useEffect(() => {
    if (!currentStory || loading) return;

    // Pulisce intervallo e timeout esistenti (usa controlli null espliciti)
    if (progressIntervalRef.current !== null) {
      window.clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (autoPauseTimeoutRef.current !== null) {
      window.clearTimeout(autoPauseTimeoutRef.current);
      autoPauseTimeoutRef.current = null;
    }

    // reset progress for the new story - immediato
    setProgress(0);

    const startTime = Date.now();
    const durationMs = duration * 1000;

    // Avvia animazione progresso - intervallo ridotto per maggiore fluidità
    progressIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / durationMs) * 100, 100);
      setProgress(newProgress);
    }, 10); // ~100fps per animazione più fluida

    // Avanzamento automatico quando la storia termina
    autoPauseTimeoutRef.current = window.setTimeout(() => {
      goToNext();
    }, durationMs);

    return () => {
      if (progressIntervalRef.current !== null) {
        window.clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (autoPauseTimeoutRef.current !== null) {
        window.clearTimeout(autoPauseTimeoutRef.current);
        autoPauseTimeoutRef.current = null;
      }
    };
  }, [currentStory, currentIndex, stories.length, duration, loading, onClose, goToNext]);

  // Funzione invio messaggio
  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !currentStory) return;

    try {
      // Ottiene o crea chat con il proprietario della storia
      const chatRes = await fetch('/api/direct/get-or-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otherProfileId: currentStory.profile_id }),
      });

      if (!chatRes.ok) throw new Error('Failed to get/create chat');
      const { chatId } = await chatRes.json();

      // Invia messaggio
      const sendRes = await fetch('/api/direct/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, text: messageText }),
      });

      if (!sendRes.ok) throw new Error('Failed to send message');

      // Pulisce input e mostra feedback
      setMessageText('');
      setShowMessageSent(true);
      setTimeout(() => setShowMessageSent(false), 2000);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageText, currentStory]);

  // Funzione toggle like
  const handleToggleLike = useCallback(async () => {
    if (!currentStory) return;

    try {
      // Aggiornamento ottimistico
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);

      // Aggiorna lo stato nella lista delle storie
      setStories(prevStories => {
        const updated = [...prevStories];
        if (updated[currentIndex]) {
          updated[currentIndex] = {
            ...updated[currentIndex],
            is_liked_by_me: newLikedState,
          };
        }
        return updated;
      });

      // Chiama API per persistere il like
      const res = await fetch(`/api/stories/${currentStory.id}/like`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to toggle like');
      }

      const data = await res.json();
      // Aggiorna stato con risposta del server
      setIsLiked(data.liked);
      
      // Sincronizza la risposta del server con l'array delle storie
      setStories(prevStories => {
        const updated = [...prevStories];
        if (updated[currentIndex]) {
          updated[currentIndex] = {
            ...updated[currentIndex],
            is_liked_by_me: data.liked,
          };
        }
        return updated;
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      // Ripristina in caso di errore
      setIsLiked(!isLiked);
      setStories(prevStories => {
        const updated = [...prevStories];
        if (updated[currentIndex]) {
          updated[currentIndex] = {
            ...updated[currentIndex],
            is_liked_by_me: !isLiked,
          };
        }
        return updated;
      });
    }
  }, [currentStory, isLiked, currentIndex]);

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

  // Se il caricamento è finito e non ci sono storie, chiudi la modale
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!loading && stories.length === 0) {
      setLoadFailed(true);
    }
  }, [loading, stories.length]);

  if (loading) {
    return <StoryViewerSkeleton onClose={onClose} />;
  }

  if (loadFailed) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="text-white text-center max-w-xs mx-auto p-6 rounded-lg bg-black bg-opacity-80 border border-gray-700">
          <div className="mb-4">
            {/* Icona di errore caricamento */}
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-2" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
            <p className="font-semibold text-lg">Impossibile caricare le storie</p>
            <p className="text-sm mt-2 opacity-80">Non ci sono storie disponibili per questo utente oppure si è verificato un errore durante il caricamento.</p>
          </div>
          <button
            className="mt-4 px-4 py-2 bg-white text-black rounded font-medium hover:bg-gray-200 transition"
            onClick={onClose}
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  if (!currentStory) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-[#1a1a1a] z-[60] flex items-center justify-center overflow-x-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      
      {/* Instagram Logo - solo desktop */}
      <div className="hidden md:block absolute top-4 left-4 z-20">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Instagram"
          role="img"
          viewBox="32 4 113 32"
          width="103"
          height="29"
          className="text-white"
        >
          <path
            clipRule="evenodd"
            fillRule="evenodd"
            fill="currentColor"
            d="M37.82 4.11c-2.32.97-4.86 3.7-5.66 7.13-1.02 4.34 3.21 6.17 3.56 5.57.4-.7-.76-.94-1-3.2-.3-2.9 1.05-6.16 2.75-7.58.32-.27.3.1.3.78l-.06 14.46c0 3.1-.13 4.07-.36 5.04-.23.98-.6 1.64-.33 1.9.32.28 1.68-.4 2.46-1.5a8.13 8.13 0 0 0 1.33-4.58c.07-2.06.06-5.33.07-7.19 0-1.7.03-6.71-.03-9.72-.02-.74-2.07-1.51-3.03-1.1Zm82.13 14.48a9.42 9.42 0 0 1-.88 3.75c-.85 1.72-2.63 2.25-3.39-.22-.4-1.34-.43-3.59-.13-5.47.3-1.9 1.14-3.35 2.53-3.22 1.38.13 2.02 1.9 1.87 5.16ZM96.8 28.57c-.02 2.67-.44 5.01-1.34 5.7-1.29.96-3 .23-2.65-1.72.31-1.72 1.8-3.48 4-5.64l-.01 1.66Zm-.35-10a10.56 10.56 0 0 1-.88 3.77c-.85 1.72-2.64 2.25-3.39-.22-.5-1.69-.38-3.87-.13-5.25.33-1.78 1.12-3.44 2.53-3.44 1.38 0 2.06 1.5 1.87 5.14Zm-13.41-.02a9.54 9.54 0 0 1-.87 3.8c-.88 1.7-2.63 2.24-3.4-.23-.55-1.77-.36-4.2-.13-5.5.34-1.95 1.2-3.32 2.53-3.2 1.38.14 2.04 1.9 1.87 5.13Zm61.45 1.81c-.33 0-.49.35-.61.93-.44 2.02-.9 2.48-1.5 2.48-.66 0-1.26-1-1.42-3-.12-1.58-.1-4.48.06-7.37.03-.59-.14-1.17-1.73-1.75-.68-.25-1.68-.62-2.17.58a29.65 29.65 0 0 0-2.08 7.14c0 .06-.08.07-.1-.06-.07-.87-.26-2.46-.28-5.79 0-.65-.14-1.2-.86-1.65-.47-.3-1.88-.81-2.4-.2-.43.5-.94 1.87-1.47 3.48l-.74 2.2.01-4.88c0-.5-.34-.67-.45-.7a9.54 9.54 0 0 0-1.8-.37c-.48 0-.6.27-.6.67 0 .05-.08 4.65-.08 7.87v.46c-.27 1.48-1.14 3.49-2.09 3.49s-1.4-.84-1.4-4.68c0-2.24.07-3.21.1-4.83.02-.94.06-1.65.06-1.81-.01-.5-.87-.75-1.27-.85-.4-.09-.76-.13-1.03-.11-.4.02-.67.27-.67.62v.55a3.71 3.71 0 0 0-1.83-1.49c-1.44-.43-2.94-.05-4.07 1.53a9.31 9.31 0 0 0-1.66 4.73c-.16 1.5-.1 3.01.17 4.3-.33 1.44-.96 2.04-1.64 2.04-.99 0-1.7-1.62-1.62-4.4.06-1.84.42-3.13.82-4.99.17-.8.04-1.2-.31-1.6-.32-.37-1-.56-1.99-.33-.7.16-1.7.34-2.6.47 0 0 .05-.21.1-.6.23-2.03-1.98-1.87-2.69-1.22-.42.39-.7.84-.82 1.67-.17 1.3.9 1.91.9 1.91a22.22 22.22 0 0 1-3.4 7.23v-.7c-.01-3.36.03-6 .05-6.95.02-.94.06-1.63.06-1.8 0-.36-.22-.5-.66-.67-.4-.16-.86-.26-1.34-.3-.6-.05-.97.27-.96.65v.52a3.7 3.7 0 0 0-1.84-1.49c-1.44-.43-2.94-.05-4.07 1.53a10.1 10.1 0 0 0-1.66 4.72c-.15 1.57-.13 2.9.09 4.04-.23 1.13-.89 2.3-1.63 2.3-.95 0-1.5-.83-1.5-4.67 0-2.24.07-3.21.1-4.83.02-.94.06-1.65.06-1.81 0-.5-.87-.75-1.27-.85-.42-.1-.79-.13-1.06-.1-.37.02-.63.35-.63.6v.56a3.7 3.7 0 0 0-1.84-1.49c-1.44-.43-2.93-.04-4.07 1.53-.75 1.03-1.35 2.17-1.66 4.7a15.8 15.8 0 0 0-.12 2.04c-.3 1.81-1.61 3.9-2.68 3.9-.63 0-1.23-1.21-1.23-3.8 0-3.45.22-8.36.25-8.83l1.62-.03c.68 0 1.29.01 2.19-.04.45-.02.88-1.64.42-1.84-.21-.09-1.7-.17-2.3-.18-.5-.01-1.88-.11-1.88-.11s.13-3.26.16-3.6c.02-.3-.35-.44-.57-.53a7.77 7.77 0 0 0-1.53-.44c-.76-.15-1.1 0-1.17.64-.1.97-.15 3.82-.15 3.82-.56 0-2.47-.11-3.02-.11-.52 0-1.08 2.22-.36 2.25l3.2.09-.03 6.53v.47c-.53 2.73-2.37 4.2-2.37 4.2.4-1.8-.42-3.15-1.87-4.3-.54-.42-1.6-1.22-2.79-2.1 0 0 .69-.68 1.3-2.04.43-.96.45-2.06-.61-2.3-1.75-.41-3.2.87-3.63 2.25a2.61 2.61 0 0 0 .5 2.66l.15.19c-.4.76-.94 1.78-1.4 2.58-1.27 2.2-2.24 3.95-2.97 3.95-.58 0-.57-1.77-.57-3.43 0-1.43.1-3.58.19-5.8.03-.74-.34-1.16-.96-1.54a4.33 4.33 0 0 0-1.64-.69c-.7 0-2.7.1-4.6 5.57-.23.69-.7 1.94-.7 1.94l.04-6.57c0-.16-.08-.3-.27-.4a4.68 4.68 0 0 0-1.93-.54c-.36 0-.54.17-.54.5l-.07 10.3c0 .78.02 1.69.1 2.09.08.4.2.72.36.91.15.2.33.34.62.4.28.06 1.78.25 1.86-.32.1-.69.1-1.43.89-4.2 1.22-4.31 2.82-6.42 3.58-7.16.13-.14.28-.14.27.07l-.22 5.32c-.2 5.37.78 6.36 2.17 6.36 1.07 0 2.58-1.06 4.2-3.74l2.7-4.5 1.58 1.46c1.28 1.2 1.7 2.36 1.42 3.45-.21.83-1.02 1.7-2.44.86-.42-.25-.6-.44-1.01-.71-.23-.15-.57-.2-.78-.04-.53.4-.84.92-1.01 1.55-.17.61.45.94 1.09 1.22.55.25 1.74.47 2.5.5 2.94.1 5.3-1.42 6.94-5.34.3 3.38 1.55 5.3 3.72 5.3 1.45 0 2.91-1.88 3.55-3.72.18.75.45 1.4.8 1.96 1.68 2.65 4.93 2.07 6.56-.18.5-.69.58-.94.58-.94a3.07 3.07 0 0 0 2.94 2.87c1.1 0 2.23-.52 3.03-2.31.09.2.2.38.3.56 1.68 2.65 4.93 2.07 6.56-.18l.2-.28.05 1.4-1.5 1.37c-2.52 2.3-4.44 4.05-4.58 6.09-.18 2.6 1.93 3.56 3.53 3.69a4.5 4.5 0 0 0 4.04-2.11c.78-1.15 1.3-3.63 1.26-6.08l-.06-3.56a28.55 28.55 0 0 0 5.42-9.44s.93.01 1.92-.05c.32-.02.41.04.35.27-.07.28-1.25 4.84-.17 7.88.74 2.08 2.4 2.75 3.4 2.75 1.15 0 2.26-.87 2.85-2.17l.23.42c1.68 2.65 4.92 2.07 6.56-.18.37-.5.58-.94.58-.94.36 2.2 2.07 2.88 3.05 2.88 1.02 0 2-.42 2.78-2.28.03.82.08 1.49.16 1.7.05.13.34.3.56.37.93.34 1.88.18 2.24.11.24-.05.43-.25.46-.75.07-1.33.03-3.56.43-5.21.67-2.79 1.3-3.87 1.6-4.4.17-.3.36-.35.37-.03.01.64.04 2.52.3 5.05.2 1.86.46 2.96.65 3.3.57 1 1.27 1.05 1.83 1.05.36 0 1.12-.1 1.05-.73-.03-.31.02-2.22.7-4.96.43-1.79 1.15-3.4 1.41-4 .1-.21.15-.04.15 0-.06 1.22-.18 5.25.32 7.46.68 2.98 2.65 3.32 3.34 3.32 1.47 0 2.67-1.12 3.07-4.05.1-.7-.05-1.25-.48-1.25Z"
          />
        </svg>
      </div>
      
      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-5 md:top-3 right-3 text-white hover:transform hover:scale-110 hover:bg-opacity-20 p-2 transition-all z-40 drop-shadow-lg"
        aria-label="Chiudi"
      >
        <X className="w-8 h-8 md:w-8.5 md:h-8.5" />
      </button>

      {/* Previous Users Previews - Left */}
      {prevUserPreviews.map((preview, index) => (
        <button
          key={`prev-${index}`}
          onClick={() => goToProfileByIndex(currentUserIndex - (index + 1), 'right')}
          className={`fixed top-1/2 -translate-y-1/2 w-[277px] h-[490px] rounded-lg overflow-hidden transition-all hidden md:block ${
            isTransitioning && transitionDirection === 'right' && index === 0
              ? 'duration-500 ease-out z-30'
              : 'duration-300 z-20 cursor-pointer'
          }`}
          style={{ 
            left: `calc(50% - 345px - ${520 + index * 357}px)`,
            transform: isTransitioning && transitionDirection === 'right' && index === 0
              ? 'translateX(500px) scale(2.49)'
              : undefined
          }}
        >
          {/* Preview Image */}
          <div className="relative w-full h-full">
            <Image
              unoptimized
              src={preview.media_url || ''}
              alt={`Previous user ${index + 1}`}
              fill
              className={`object-cover ${
                isTransitioning && transitionDirection === 'right' && index === 0
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            />
          </div>
          
          {/* Preview User info overlay */}
          <div className="absolute top-47 left-2 right-2 flex flex-col items-center gap-2.5">
            {/* Profile picture */}
            <div className="p-1 rounded-full border-2 border-gray-700 flex items-center justify-center">
              <ProfilePicture
                src={preview.profile_image_url}
                alt={preview.username}
                size={52}
              />
            </div>
            {/* Username */}
            <span className="text-white text-xs font-semibold truncate max-w-full px-1">
              {preview.username}
            </span>
          </div>
        </button>
      ))}

      {/* Story content */}
      <div className={`relative w-full max-w-[690px] h-[100vh] md:h-[90vh] lg:h-[96vh] mx-0 sm:mx-4 overflow-hidden rounded-none sm:rounded-lg z-20 ${
        isTransitioning || isReturning
          ? 'transition-all duration-500 ease-out' 
          : ''
      } ${
        isReturning && transitionDirection === 'left'
          ? 'translate-x-[-465px] scale-[2.49]'
          : isReturning && transitionDirection === 'right'
          ? 'translate-x-[465px] scale-[2.49]'
          : isTransitioning && transitionDirection === 'left' 
          ? 'translate-x-[-465px] scale-[0.402] opacity-0' 
          : isTransitioning && transitionDirection === 'right' 
          ? 'translate-x-[465px] scale-[0.402] opacity-0' 
          : 'translate-x-0 scale-100 opacity-100'
      }`}>
        {/* Gradient overlay - Top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent z-10 pointer-events-none" />
        
        {/* Gradient overlay - Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent z-10 pointer-events-none" />

        {currentStory.media_type === 'image' ? (
          <div className="relative w-full h-full">
            <Image
              unoptimized
              src={currentStory.media_url}
              alt="storia"
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <video
            key={currentStory.id}
            ref={videoRef}
            src={currentStory.media_url}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            loop
            muted={isMuted}
            onLoadedData={() => {
              setVideoError(false);
              if (videoRef.current) {
                videoRef.current.play().catch(err => {
                  console.error('Video play error:', err);
                  setVideoError(true);
                });
              }
            }}
            onError={(e) => {
              console.error('Video loading error:', e);
              setVideoError(true);
            }}
          />
        )}

        {/* Video Error Message */}
        {currentStory.media_type === 'video' && videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white z-10">
            <div className="text-center">
              <p className="text-sm">Impossibile caricare il video</p>
              <p className="text-xs mt-2 opacity-70">{currentStory.media_url}</p>
            </div>
          </div>
        )}


        {/* Progress bars container - INSIDE story */}
        <div className="absolute top-5 left-4 right-4 z-20 flex gap-1">
          {stories.map((_, idx) => (
            <div
              key={idx}
              className="flex-1 h-0.5 bg-gray-500 bg-opacity-50 rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-white transition-none"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story header - Profile info - INSIDE story */}
        <div className="absolute top-8 left-4 right-3 flex items-center gap-3 z-40">
          <ProfilePicture
            src={currentStory.profile_image_url}
            alt={currentStory.username}
            size={32}
          />
          <div className="flex-1">
            <Link 
              href={`/profile/${currentStory.username}`}
              className="text-white font-semibold text-sm drop-shadow-lg hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              {currentStory.username}
              {currentStory.is_verified && (
                <VerifiedBadge size={12} color="white" />
              )}
            </Link>
            <p className="text-white text-xs opacity-80 drop-shadow-lg">
              {(() => {
                const now = new Date();
                const storyDate = new Date(currentStory.created_at);
                const diffMs = now.getTime() - storyDate.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                if (diffHours < 1) {
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  return `${diffMins}m`;
                }
                return `${diffHours}h`;
              })()}
            </p>
          </div>
        </div>

        {/* Mute button for videos */}
        {currentStory.media_type === 'video' && (
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="absolute bottom-16 md:bottom-20 right-2 md:right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all z-20"
            aria-label={isMuted ? 'Abilita audio' : 'Disabilita audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>
        )}

        {/* Bottom interaction bar */}
        <div className="absolute bottom-2 md:bottom-4 left-2 md:left-4 right-2 md:right-4 flex items-center gap-2 md:gap-2.5 z-40">

          {/* Message input */}
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && messageText.trim()) {
                handleSendMessage();
              }
            }}
            placeholder={`Rispondi a ${currentStory.username}`}
            className="flex-1 max-w-[570px] bg-transparent border-2 border-white/70 rounded-full px-3 md:px-4 py-2 md:py-3 text-white placeholder-white/80 text-sm md:text-sm focus:outline-none focus:border-white"
          />

          {/* Action buttons */}
          <div className="flex items-center gap-3 md:gap-4 ml-0 md:ml-1.5">

            {/* Like button */}
            <button
              onClick={handleToggleLike}
              className="flex-shrink-0 hover:scale-110 transition-transform drop-shadow-lg"
              aria-label={isLiked ? 'Rimuovi like' : 'Metti like'}
            >
              <Heart
                className={`w-7 h-7 md:w-6.5 md:h-6.5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`}
              />
            </button>

            {/* Share button */}
            <button
              onClick={handleSendMessage}
              className="flex-shrink-0 hover:scale-110 transition-transform drop-shadow-lg"
              aria-label="Condividi storia"
            >
              <ShareIcon size={28} className="text-white" />
            </button>
          </div>
        </div>

        {/* Message Sent Feedback */}
        {showMessageSent && (
          <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 bg-black bg-opacity-80 text-white px-6 py-3 rounded-lg text-sm font-medium z-50 animate-fade-in">
            Messaggio inviato
          </div>
        )}
      </div>

      {/* Next Users Previews - Right */}
      {nextUserPreviews.map((preview, index) => (
        <button
          key={`next-${index}`}
          onClick={() => goToProfileByIndex(currentUserIndex + (index + 1), 'left')}
          className={`fixed top-1/2 -translate-y-1/2 w-[277px] h-[490px] rounded-lg overflow-hidden transition-all hidden md:block ${
            isTransitioning && transitionDirection === 'left' && index === 0
              ? 'duration-500 ease-out z-30'
              : 'duration-300 z-20 cursor-pointer'
          }`}
          style={{ 
            right: `calc(50% - 345px - ${520 + index * 357}px)`,
            transform: isTransitioning && transitionDirection === 'left' && index === 0
              ? 'translateX(-465px) scale(2.49)'
              : undefined
          }}
        >
          {/* Preview Image */}
          <div className="relative w-full h-full">
            <Image
              unoptimized
              src={preview.media_url || ''}
              alt={`Next user ${index + 1}`}
              fill
              className={`object-cover ${
                isTransitioning && transitionDirection === 'left' && index === 0
                  ? 'opacity-100'
                  : 'opacity-40'
              }`}
            />
          </div>
          
          {/* Preview User info overlay */}
          <div className="absolute top-47 left-2 right-2 flex flex-col items-center gap-2.5">
            {/* Profile picture */}
            <div className="p-1 rounded-full border-2 border-gray-700 flex items-center justify-center">
              <ProfilePicture
                src={preview.profile_image_url}
                alt={preview.username}
                size={52}
              />
            </div>
            {/* Username */}
            <span className="text-white text-xs font-semibold truncate max-w-full px-1">
              {preview.username}
            </span>
          </div>
        </button>
      ))}

      {/* Previous button/tap area */}
      {(currentIndex > 0 || (allUsernames.length > 0 && currentUserIndex > 0)) && (
        <>
          {/* Desktop arrow button */}
          <button
            onClick={goToPrevious}
            className="hidden md:block fixed top-1/2 -translate-y-1/2 left-[calc(50%-345px-40px)] bg-gray-500 hover:bg-white p-0.25 rounded-full transition-all z-30"
            aria-label="Storia precedente"
          >
            <ChevronLeft className="w-5 h-5 text-black" />
          </button>
          {/* Mobile tap area (invisible) */}
          <button
            onClick={goToPrevious}
            className="md:hidden fixed top-20 bottom-0 left-0 w-1/3 z-30"
            aria-label="Storia precedente"
          />
        </>
      )}

      {/* Next button/tap area */}
      {(currentIndex < stories.length - 1 || (allUsernames.length > 0 && currentUserIndex < allUsernames.length - 1)) && (
        <>
          {/* Desktop arrow button */}
          <button
            onClick={goToNext}
            className="hidden md:block fixed top-1/2 -translate-y-1/2 right-[calc(50%-345px-40px)] bg-gray-500 hover:bg-white p-0.25 rounded-full transition-all z-30"
            aria-label="Storia successiva"
          >
            <ChevronRight className="w-5 h-5 text-black" />
          </button>
          {/* Mobile tap area (invisible) */}
          <button
            onClick={goToNext}
            className="md:hidden fixed top-20 bottom-0 right-0 w-1/3 z-30"
            aria-label="Storia successiva"
          />
        </>
      )}
    </div>
  );
}

