/**
 * @fileoverview Pagina Reels - Visualizzatore video full-screen stile TikTok
 * 
 * Questa pagina implementa un player video verticale con:
 * - Navigazione swipe/scroll per passare tra i reels
 * - Animazioni di transizione fluide
 * - Supporto touch per dispositivi mobili
 * - Pannello commenti a comparsa
 * - Interazioni like/save/share
 * - Controlli audio e play/pause
 * 
 * @module app/(main)/reels/page
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  MoreHorizontal, 
  Play, 
  VolumeX, 
  Volume2, 
  Music, 
  X 
} from 'lucide-react';
import {ProfilePicture} from '@/components';
import { LoadingSpinner } from '@/components/common';
import {ReelsSkeleton} from '@/components/common/skeletons';
import { VerifiedBadge, ShareIcon } from '@/components/common';;
import { formatTimeAgo } from '@/lib/date-utils';
import { getMediaUrl } from '@/lib/media';
import { createCommentAction, listCommentsAction } from '@/features/comments';
import { toggleLikeAction } from '@/features/likes';
import { togglePostSaveAction } from '@/features/posts';
import { getReelsAction, type ReelItem } from '@/features/reels';

/**
 * Struttura di un commento
 */
interface Comment {
  /** Identificativo univoco del commento */
  id: number;
  /** Testo del commento */
  text: string;
  /** Data di creazione */
  created_at: string;
  /** Username dell'autore del commento */
  profile_username: string;
  /** URL immagine profilo */
  profile_image_url: string | null;
  /** Flag verifica account */
  profile_is_verified: boolean;
  /** Numero di like al commento */
  likes_count: number;
  /** Flag: utente corrente ha messo like */
  is_liked_by_current_user: boolean;
  /** Array risposte al commento */
  replies?: Comment[];
}

// ============================================================================
// COSTANTI DI CONFIGURAZIONE
// ============================================================================

/** Distanza minima in pixel per riconoscere uno swipe */
const MIN_SWIPE_DISTANCE = 50;

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * ReelsPage - Pagina visualizzatore reels
 * 
 * Gestisce la visualizzazione e navigazione dei video reels in formato
 * full-screen verticale, con supporto per:
 * - Scroll wheel (desktop)
 * - Swipe touch (mobile)
 * - Navigazione tastiera (frecce, j/k, spazio, m)
 * 
 * @returns Componente pagina reels
 */
export default function ReelsPage() {
  // ==========================================================================
  // STATE - Dati e Paginazione
  // ==========================================================================

  /** Lista dei reels caricati */
  const [reels, setReels] = useState<ReelItem[]>([]);
  
  /** Indice del reel attualmente visualizzato */
  const [currentIndex, setCurrentIndex] = useState(0);
  
  /** Flag: caricamento iniziale in corso */
  const [isLoading, setIsLoading] = useState(true);
  
  /** Flag: esistono altri reels da caricare */
  const [hasMore, setHasMore] = useState(true);

  /** ID dei reels già ricevuti, per escluderli dalle fetch successive */
  const [seenIds, setSeenIds] = useState<number[]>([]);

  // ==========================================================================
  // STATE - Riproduzione Video
  // ==========================================================================

  /** Flag: video in riproduzione */
  const [isPlaying, setIsPlaying] = useState(true);
  
  /** Flag: audio silenziato */
  const [isMuted, setIsMuted] = useState(true);

  // ==========================================================================
  // STATE - Animazioni e Transizioni
  // ==========================================================================

  /** Flag: transizione tra reels in corso */
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  /** Direzione dello slide corrente */
  const [slideDirection, setSlideDirection] = useState<'up' | 'down'>('up');
  
  /** Flag: animazione cuore like visibile */
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  
  /** Flag: cuore esplosivo (doppio tap) visibile */
  const [showExplodingHeart, setShowExplodingHeart] = useState(false);

  // ==========================================================================
  // STATE - Commenti
  // ==========================================================================

  /** Flag: pannello commenti aperto */
  const [showComments, setShowComments] = useState(false);
  
  /** Lista commenti del reel corrente */
  const [comments, setComments] = useState<Comment[]>([]);
  
  /** Testo del nuovo commento in scrittura */
  const [commentText, setCommentText] = useState('');
  
  /** Flag: caricamento commenti in corso */
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  
  /** Flag: invio commento in corso */
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ==========================================================================
  // STATE - Touch Navigation
  // ==========================================================================

  /** Posizione Y iniziale del touch */
  const [touchStart, setTouchStart] = useState<number | null>(null);
  
  /** Posizione Y finale del touch */
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // ==========================================================================
  // REFS
  // ==========================================================================

  /** Riferimento al container principale per eventi wheel */
  const containerRef = useRef<HTMLDivElement>(null);
  
  /** Mappa riferimenti agli elementi video per controllo playback */
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  
  /** Timestamp ultimo scroll (per debouncing) */
  const lastScrollTime = useRef(0);
  
  /** Riferimento al pannello commenti per gestione click esterni */
  const commentsRef = useRef<HTMLDivElement>(null);

  // ==========================================================================
  // EFFECTS - Caricamento Iniziale
  // ==========================================================================

  /**
   * Effect: Carica i reels iniziali al mount del componente
   */
  useEffect(() => {
    fetchReels([]);
  }, []);

  // ==========================================================================
  // EFFECTS - Controllo Riproduzione Video
  // ==========================================================================

  /**
   * Effect: Gestisce play/pause dei video quando cambia l'indice corrente
   * 
   * Mette in pausa tutti i video tranne quello attualmente visualizzato.
   * Ripristina la posizione del video corrente all'inizio se non è in riproduzione.
   */
  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (index === currentIndex) {
        // Video corrente: play o pause in base allo stato
        if (isPlaying) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      } else {
        // Altri video: metti in pausa e resetta posizione
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying]);

  /**
   * Effect: Aggiorna lo stato muted di tutti i video
   */
  useEffect(() => {
    videoRefs.current.forEach((video) => {
      video.muted = isMuted;
    });
  }, [isMuted]);

  // ==========================================================================
  // EFFECTS - Caricamento Commenti
  // ==========================================================================

  /**
   * Effect: Carica i commenti quando si apre il pannello commenti
   */
  useEffect(() => {
    if (showComments && reels[currentIndex]) {
      fetchComments(reels[currentIndex].id);
    }
  }, [showComments, currentIndex]);

  // ==========================================================================
  // EFFECTS - Navigazione Tastiera
  // ==========================================================================

  // NOTA: L'useEffect per la tastiera è definito dopo navigateToReel

  // ==========================================================================
  // EFFECTS - Scroll Wheel
  // ==========================================================================

  // NOTA: L'useEffect per lo scroll wheel è definito dopo handleWheel

  // ==========================================================================
  // API - Fetch Functions
  // ==========================================================================

  /**
   * Recupera i reels dall'API con paginazione
   * 
   * Carica 5 reels per volta e aggiorna il cursore per la paginazione.
   * Gestisce anche il flag hasMore per sapere se ci sono altri contenuti.
   */
  const fetchReels = async (currentSeenIds: number[] = []) => {
    const result = await getReelsAction({ limit: 5, excludeIds: currentSeenIds });
    if (!result.success) {
      console.error('Errore nel caricamento reels:', result.error);
      setIsLoading(false);
      return;
    }
    const newReels = result.data.reels;
    setReels(prev => currentSeenIds.length === 0 ? newReels : [...prev, ...newReels]);
    setSeenIds(prev => [...prev, ...newReels.map(r => r.id)]);
    setHasMore(result.data.hasMore);
    setIsLoading(false);
  };

  /**
   * Recupera i commenti per un determinato reel
   * 
   * @param reelId - ID del reel di cui caricare i commenti
   */
  const fetchComments = async (reelId: number) => {
    setIsLoadingComments(true);
    try {
      const result = await listCommentsAction({ postId: reelId, limit: 50, offset: 0 });
      if (!result.success) throw new Error(result.error);
      setComments(result.data.comments || []);
    } catch (error) {
      console.error('Errore nel caricamento commenti:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  // ==========================================================================
  // NAVIGAZIONE - Handler Movimento tra Reels
  // ==========================================================================

  /**
   * Naviga al reel successivo o precedente
   * 
   * Gestisce l'animazione di transizione e il caricamento di nuovi reels
   * quando si avvicina alla fine della lista.
   * 
   * @param direction - Direzione: 'next' per il successivo, 'prev' per il precedente
   */
  const navigateToReel = useCallback((direction: 'next' | 'prev') => {
    // Previeni navigazione durante transizioni
    if (isTransitioning) return;
    
    // Calcola il nuovo indice
    const newIndex = direction === 'next' 
      ? Math.min(currentIndex + 1, reels.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    // Se l'indice non cambia, non fare nulla
    if (newIndex === currentIndex) return;

    // Imposta direzione animazione e avvia transizione
    setSlideDirection(direction === 'next' ? 'up' : 'down');
    setIsTransitioning(true);
    
    // Chiudi il pannello commenti durante la navigazione
    setShowComments(false);

    // Aggiorna l'indice dopo un breve delay per l'animazione
    setTimeout(() => {
      setCurrentIndex(newIndex);
      setIsTransitioning(false);
    }, 400);

    // Pre-carica nuovi reels quando ci si avvicina alla fine
    if (direction === 'next' && newIndex >= reels.length - 2 && hasMore && !isLoading) {
      fetchReels(seenIds);
    }
  }, [currentIndex, reels.length, hasMore, isLoading, isTransitioning]);

  /**
   * Handler per lo scroll wheel (mouse/trackpad)
   * 
   * Implementa debouncing per evitare navigazioni troppo rapide.
   * Ignora gli scroll all'interno del pannello commenti.
   */
  const handleWheel = useCallback((e: WheelEvent) => {
    // Non cambiare reel se si sta scrollando nei commenti
    if (commentsRef.current && commentsRef.current.contains(e.target as Node)) {
      return;
    }
    
    e.preventDefault();
    
    // Debounce: attendi almeno 500ms tra una navigazione e l'altra
    const now = Date.now();
    if (now - lastScrollTime.current < 500) return;
    
    lastScrollTime.current = now;

    // Naviga in base alla direzione dello scroll
    if (e.deltaY > 0) {
      navigateToReel('next');
    } else if (e.deltaY < 0) {
      navigateToReel('prev');
    }
  }, [navigateToReel]);

  // ==========================================================================
  // EFFECTS - Navigazione Tastiera (spostato qui per evitare uso prima della dichiarazione)
  // ==========================================================================

  /**
   * Effect: Configura handler per navigazione da tastiera
   * 
   * Tasti supportati:
   * - ArrowDown / j: reel successivo
   * - ArrowUp / k: reel precedente
   * - Spazio: play/pause
   * - m: mute/unmute
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se il focus è su un input (es. campo commento)
      if (showComments && e.target instanceof HTMLInputElement) return;
      
      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          navigateToReel('next');
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          navigateToReel('prev');
          break;
        case 'm':
          setIsMuted(prev => !prev);
          break;
        case ' ':
          e.preventDefault();
          setIsPlaying(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateToReel, showComments]);

  /**
   * Effect: Attacca l'event listener per lo scroll wheel
   */
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // ==========================================================================
  // NAVIGAZIONE - Touch Handlers (Mobile)
  // ==========================================================================

  /**
   * Handler inizio touch - memorizza posizione iniziale
   */
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  /**
   * Handler movimento touch - aggiorna posizione corrente
   */
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  /**
   * Handler fine touch - calcola direzione swipe e naviga
   */
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > MIN_SWIPE_DISTANCE;
    const isSwipeDown = distance < -MIN_SWIPE_DISTANCE;

    if (isSwipeUp) {
      navigateToReel('next');
    } else if (isSwipeDown) {
      navigateToReel('prev');
    }
  };

  // ==========================================================================
  // INTERAZIONI - Like e Save
  // ==========================================================================

  /**
   * Gestisce il like/unlike di un reel
   * 
   * Chiama l'API che fa toggle automatico dello stato like.
   * Aggiorna lo state locale con il nuovo conteggio.
   * 
   * @param reelId - ID del reel da likare/unlikare
   */
  const handleLike = async (reelId: number) => {
    const result = await toggleLikeAction({ likeableType: 'post', likeableId: reelId });
    if (!result.success) {
      console.error('Errore nel like del reel:', result.error);
      return;
    }
    setReels(prev => prev.map(r =>
      r.id === reelId
        ? { ...r, isLikedByCurrentUser: result.data.liked, likesCount: result.data.count }
        : r
    ));
  };

  /**
   * Gestisce il salvataggio/rimozione dai salvati di un reel
   * 
   * @param reelId - ID del reel da salvare/rimuovere
   */
  const handleSave = async (reelId: number) => {
    const result = await togglePostSaveAction({ postId: reelId });
    if (!result.success) {
      console.error('Errore nel salvataggio reel:', result.error);
      return;
    }

    setReels(prev => prev.map(r =>
      r.id === reelId
        ? { ...r, isSavedByCurrentUser: result.data.saved }
        : r
    ));
  };

  /**
   * Gestisce il doppio tap per like veloce
   * 
   * Mostra l'animazione cuore esplosivo e mette like se non già presente.
   * 
   * @param reelId - ID del reel
   */
  const handleDoubleTap = (reelId: number) => {
    // Mostra animazione cuore esplosivo
    setShowExplodingHeart(true);
    setTimeout(() => setShowExplodingHeart(false), 1000);

    // Metti like solo se non già presente
    const reel = reels.find(r => r.id === reelId);
    if (reel && !reel.isLikedByCurrentUser) {
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 400);
      handleLike(reelId);
    }
  };

  // ==========================================================================
  // INTERAZIONI - Commenti
  // ==========================================================================

  /**
   * Invia un nuovo commento al reel corrente
   */
  const handleCommentSubmit = async () => {
    const currentReel = reels[currentIndex];
    if (!currentReel || !commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const result = await createCommentAction({ postId: currentReel.id, text: commentText });
      if (!result.success) throw new Error(result.error);
      
      // Aggiungi il nuovo commento in cima alla lista
      setComments(prev => [result.data, ...prev]);
      setCommentText('');

      // Aggiorna il conteggio commenti del reel
      setReels(prev => prev.map(r => 
        r.id === currentReel.id 
          ? { ...r, comments_count: r.comments_count + 1 }
          : r
      ));
    } catch (error) {
      console.error('Errore invio commento:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * Mette like a un commento
   * 
   * @param commentId - ID del commento
   */
  const handleCommentLike = async (commentId: number) => {
    const result = await toggleLikeAction({ likeableType: 'comment', likeableId: commentId });
    if (!result.success) {
      console.error('Errore like commento:', result.error);
      return;
    }
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, is_liked_by_current_user: result.data.liked, likes_count: result.data.count }
        : c
    ));
  };

  // ==========================================================================
  // UTILITY - Formattazione
  // ==========================================================================

  /**
   * Formatta un numero in formato abbreviato (K, M)
   * 
   * @param count - Numero da formattare
   * @returns Stringa formattata (es. "1.5K", "2.3M")
   */
  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${Math.floor(count / 100) / 10}.${Math.floor((count % 100) / 10)}00,0`;
    }
    return count.toString();
  };

  // ==========================================================================
  // VARIABILI DERIVATE
  // ==========================================================================

  /** Reel attualmente visualizzato */
  const currentReel = reels[currentIndex];

  // ==========================================================================
  // RENDER - Stati di Caricamento e Vuoto
  // ==========================================================================

  // Stato: caricamento iniziale
  if (isLoading) {
    return <ReelsSkeleton />;  
  }

  // Stato: nessun reel disponibile
  if (reels.length === 0) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg-primary)] lg:left-[80px] xl:left-[336px] pb-14 lg:pb-0">
        <div className="text-[var(--color-text-primary)] text-center">
          <p className="text-xl mb-2">Nessun reel disponibile</p>
          <p className="text-[var(--color-text-secondary)]">I reels appariranno qui</p>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER - Contenuto Principale
  // ==========================================================================

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 bg-[var(--color-bg-primary)] overflow-hidden touch-pan-y select-none pb-14 lg:pb-0 lg:left-[80px] xl:left-[336px]"
    >
      {/* ------------------------------------------------------------------ */}
      {/* Container principale Reels */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative h-full w-full flex items-center justify-center">
        {/* Stack Reels con animazione slide */}
        <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
          {reels.map((reel, index) => {
            // ----------------------------------------------------------------
            // Ottimizzazione: renderizza solo reel visibili (corrente ±1)
            // ----------------------------------------------------------------
            const isVisible = Math.abs(index - currentIndex) <= 1;
            if (!isVisible) return null;

            // Calcola posizione e stato animazione
            const isCurrent = index === currentIndex;
            const isPrev = index === currentIndex - 1;
            const isNext = index === currentIndex + 1;
            const reelVideo = reel.media.find((m) => m.mediaType === 'video');
            const reelPrimaryMedia = reelVideo ?? reel.media[0];

            // Determina transform e opacità per l'animazione
            let translateY = '0%';
            let opacity = 1;
            const scale = 1;

            if (isPrev) {
              translateY = '-100%';
              opacity = isTransitioning && slideDirection === 'down' ? 1 : 0;
            } else if (isNext) {
              translateY = '100%';
              opacity = isTransitioning && slideDirection === 'up' ? 1 : 0;
            } else if (isCurrent && isTransitioning) {
              translateY = slideDirection === 'up' ? '-100%' : '100%';
              opacity = 0;
            }

            return (
              <div
                key={reel.id}
                className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-400 ease-out pt-0 lg:pt-20"
                style={{
                  transform: `translateY(${translateY}) scale(${scale})`,
                  opacity,
                  zIndex: isCurrent ? 10 : 5,
                  transitionDuration: '400ms',
                }}
              >
                {/* -------------------------------------------------------------- */}
                {/* Container singolo Reel con azioni laterali */}
                {/* -------------------------------------------------------------- */}
                <div className="relative flex items-center gap-4 lg:gap-4 w-full h-full lg:w-auto lg:h-auto justify-center">
                  
                  {/* ------------------------------------------------------------ */}
                  {/* Container Video - responsive per mobile nav */}
                  {/* ------------------------------------------------------------ */}
                  <div 
                    className="relative reel-frame-mobile lg:w-[421px] lg:h-[748.2px] lg:rounded-lg overflow-hidden bg-black lg:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                    onDoubleClick={() => handleDoubleTap(reel.id)}
                    onClick={() => setIsPlaying(prev => !prev)}
                  >
                    {/* Video Element */}
                    {reelPrimaryMedia && (
                      <>
                        {reelPrimaryMedia.mediaType === 'video' ? (
                          <video
                            ref={(el) => {
                              if (el) videoRefs.current.set(index, el);
                            }}
                            src={getMediaUrl(reelPrimaryMedia.mediaUrl) ?? ''}
                            className="absolute inset-0 w-full h-full object-cover"
                            loop
                            muted={isMuted}
                            playsInline
                            autoPlay={isCurrent}
                          />
                        ) : (
                          <img
                            src={getMediaUrl(reelPrimaryMedia.mediaUrl) ?? ''}
                            alt="Reel media"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        )}

                        {/* Gradient overlay per leggibilità testo */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

                        {/* Indicatore Play/Pause - stile Instagram */}
                        {!isPlaying && isCurrent && (
                          <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div 
                              className="flex items-center justify-center rounded-full bg-black/60 shadow-lg" 
                              style={{ width: 72, height: 72 }}
                            >
                              <Play className="w-12 h-12 text-white fill-white drop-shadow-lg" />
                            </div>
                          </div>
                        )}

                        {/* Animazione cuore su doppio tap */}
                        {showExplodingHeart && isCurrent && (
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-30">
                            <Heart
                              className="w-28 h-28 fill-white text-white animate-ping"
                              style={{ animationDuration: '0.6s' }}
                            />
                          </div>
                        )}

                        {/* Pulsante Mute - angolo superiore destro */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsMuted(prev => !prev);
                          }}
                          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-[#262626]/70 flex items-center justify-center hover:bg-[#262626] transition-colors"
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </button>

                        {/* ---------------------------------------------------- */}
                        {/* Sezione Info Utente - sempre testo bianco su video */}
                        {/* ---------------------------------------------------- */}
                        <div className="absolute bottom-4 left-3 right-3 z-20">
                          {/* Riga info utente */}
                          <div className="flex items-center gap-2 mb-2">
                            <Link href={`/profile/${reel.profileUsername}`} onClick={(e) => e.stopPropagation()}>
                              <ProfilePicture
                                src={reel.profileImageUrl}
                                alt={reel.profileUsername}
                                size={36}
                              />
                            </Link>
                            <Link 
                              href={`/profile/${reel.profileUsername}`}
                              className="flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-white font-semibold text-sm">
                                {reel.profileUsername}
                              </span>
                              {reel.profileIsVerified && <VerifiedBadge size={12} />}
                            </Link>
                            <span className="text-white/70">•</span>
                            <button 
                              className="text-white text-sm font-semibold border border-white/40 rounded-md px-3 py-1 hover:bg-white/10 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Segui
                            </button>
                          </div>

                          {/* Didascalia */}
                          {reel.caption && (
                            <p className="text-white text-sm mb-3 line-clamp-2 leading-relaxed">
                              {reel.caption}
                            </p>
                          )}

                          {/* Info Audio/Musica */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
                              <Music className="w-3 h-3 text-white" />
                              <span className="text-white text-xs">
                                {reel.profileUsername} · Audio originale
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ------------------------------------------------------------ */}
                  {/* Pannello Azioni Laterali */}
                  {/* Mobile: in basso a destra dentro il frame */}
                  {/* Desktop: di lato al video */}
                  {/* ------------------------------------------------------------ */}
                  <div className="reel-actions-mobile flex flex-col items-center gap-4 self-end mb-4">
                    
                    {/* Pulsante Like */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!reel.isLikedByCurrentUser) {
                          setIsLikeAnimating(true);
                          setTimeout(() => setIsLikeAnimating(false), 400);
                        }
                        handleLike(reel.id);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Heart
                        className={`w-7 h-7 transition-transform ${
                          reel.isLikedByCurrentUser
                            ? 'fill-[var(--color-like)] text-[var(--color-like)]'
                            : 'text-[var(--color-text-primary)]'
                        } ${isLikeAnimating && isCurrent ? 'scale-125' : ''}`}
                      />
                      <span className="text-[var(--color-text-primary)] text-xs font-medium">
                        {formatCount(reel.likesCount)}
                      </span>
                    </button>

                    {/* Pulsante Commenti con popup */}
                    <div className="relative flex flex-col items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowComments(!showComments);
                        }}
                        className="flex flex-col items-center gap-1 z-10"
                        id={`comments-btn-${reel.id}`}
                      >
                        <MessageCircle className="w-7 h-7 text-[var(--color-text-primary)] icon-mirrored" />
                        <span className="text-[var(--color-text-primary)] text-xs font-medium">
                          {reel.commentsCount}
                        </span>
                      </button>

                      {/* -------------------------------------------------- */}
                      {/* Popup Commenti Desktop - stile cloud con freccia */}
                      {/* -------------------------------------------------- */}
                      {showComments && isCurrent && (
                        <div
                          ref={commentsRef}
                          className="hidden lg:flex absolute z-50 max-h-[90vh] bg-[#262626] rounded-xl flex-col overflow-hidden shadow-2xl"
                          style={{ left: 'calc(100% + 12px)', bottom: '0' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Freccia verso il pulsante */}
                          <div className="absolute -left-2 bottom-4 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-[#262626]" />

                          {/* Header */}
                          <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
                            <button onClick={() => setShowComments(false)} className="text-white hover:opacity-70">
                              <X className="w-5 h-5" />
                            </button>
                            <span className="text-[15px] font-semibold text-white">Commenti</span>
                            <div className="w-5" />
                          </div>

                          {/* Lista Commenti */}
                          <div className="flex-1 overflow-y-auto px-4 py-3 max-h-[350px]">
                            {isLoadingComments ? (
                              <div className="text-center text-[#A8A8A8] py-6 text-sm">
                                Caricamento commenti...
                              </div>
                            ) : comments.length === 0 ? (
                              <div className="text-center text-[#A8A8A8] py-6 text-sm">
                                Nessun commento ancora. Sii il primo!
                              </div>
                            ) : (
                              comments.map((comment) => (
                                <div key={comment.id} className="mb-4">
                                  <div className="flex gap-2.5">
                                    <Link href={`/profile/${comment.profile_username}`}>
                                      <ProfilePicture 
                                        src={comment.profile_image_url} 
                                        alt={comment.profile_username} 
                                        size={32} 
                                      />
                                    </Link>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <Link 
                                              href={`/profile/${comment.profile_username}`} 
                                              className="font-semibold text-sm text-white hover:opacity-70"
                                            >
                                              {comment.profile_username}
                                            </Link>
                                            {comment.profile_is_verified && <VerifiedBadge size={10} />}
                                            <span className="text-xs text-[#A8A8A8]">
                                              {formatTimeAgo(comment.created_at)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-white mt-0.5 leading-[1.4] break-words">
                                            {comment.text}
                                          </p>
                                          <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-xs text-[#A8A8A8]">
                                              Mi piace: {comment.likes_count}
                                            </span>
                                            <button className="text-xs text-[#A8A8A8] font-semibold hover:text-white">
                                              Rispondi
                                            </button>
                                          </div>
                                          {comment.replies && comment.replies.length > 0 && (
                                            <button className="flex items-center gap-2 mt-2 text-xs text-[#A8A8A8] hover:text-white">
                                              <span className="w-5 h-[1px] bg-[#A8A8A8]"></span>
                                              Visualizza tutte le {comment.replies.length} risposte
                                            </button>
                                          )}
                                        </div>
                                        <button 
                                          onClick={() => handleCommentLike(comment.id)} 
                                          className="flex-shrink-0 mt-1"
                                        >
                                          <Heart 
                                            className={`w-3.5 h-3.5 ${
                                              comment.is_liked_by_current_user 
                                                ? 'fill-[#ED4956] text-[#ED4956]' 
                                                : 'text-[#A8A8A8]'
                                            }`} 
                                          />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Input Nuovo Commento */}
                          <div className="border-t border-[#363636] px-3 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <ProfilePicture src={null} alt="You" size={28} />
                              <input 
                                type="text" 
                                placeholder="Aggiungi un commento..." 
                                value={commentText} 
                                onChange={(e) => setCommentText(e.target.value)} 
                                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} 
                                className="flex-1 bg-transparent text-sm text-white placeholder-[#A8A8A8] outline-none" 
                              />
                              <button 
                                onClick={handleCommentSubmit} 
                                disabled={isSubmittingComment || !commentText.trim()} 
                                className="font-semibold text-sm hover:underline disabled:opacity-30 transition-opacity text-[#0095F6]"
                              >
                                {isSubmittingComment ? 'Invio...' : 'Pubblica'}
                              </button>
                              <button className="text-[#A8A8A8] hover:text-white transition-colors">
                                <svg aria-label="Emoji" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                                  <title>Emoji</title>
                                  <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pulsante Condividi */}
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex flex-col items-center gap-1"
                    >
                      <ShareIcon size={28} className="text-[var(--color-text-primary)]" />
                    </button>

                    {/* Pulsante Salva */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(reel.id);
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Bookmark
                        className={`w-7 h-7 ${
                          reel.isSavedByCurrentUser
                            ? 'fill-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      />
                    </button>

                    {/* Pulsante Altre Opzioni */}
                    <button onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="w-7 h-7 text-[var(--color-text-primary)]" />
                    </button>

                    {/* Disco Audio/Musica - ruota continuamente */}
                    <div 
                      className="w-8 h-8 rounded-md overflow-hidden mt-1 animate-spin" 
                      style={{ animationDuration: '3s' }}
                    >
                      <ProfilePicture
                        src={reel.profileImageUrl}
                        alt={reel.profileUsername}
                        size={28}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Bottom Sheet Commenti Mobile */}
      {/* -------------------------------------------------------------------- */}
      {showComments && (
        <>
          {/* Backdrop Mobile */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/60 z-[90]" 
            onClick={() => setShowComments(false)} 
          />
          
          {/* Sheet Commenti */}
          <div 
            className="fixed inset-x-0 bottom-0 mb-[52px] lg:hidden z-[100] w-full h-[70vh] bg-[#262626] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl animate-slideUp" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar mobile */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-[#A8A8A8] rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#363636]">
              <button onClick={() => setShowComments(false)} className="text-white hover:opacity-70">
                <X className="w-5 h-5" />
              </button>
              <span className="text-[15px] font-semibold text-white">Commenti</span>
              <div className="w-5" />
            </div>

            {/* Lista Commenti Mobile */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {isLoadingComments ? (
                <div className="text-center text-[#A8A8A8] py-6 text-sm">
                  Caricamento commenti...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-[#A8A8A8] py-6 text-sm">
                  Nessun commento ancora. Sii il primo!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="mb-4">
                    <div className="flex gap-2.5">
                      <Link href={`/profile/${comment.profile_username}`}>
                        <ProfilePicture 
                          src={comment.profile_image_url} 
                          alt={comment.profile_username} 
                          size={32} 
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link 
                                href={`/profile/${comment.profile_username}`} 
                                className="font-semibold text-sm text-white hover:opacity-70"
                              >
                                {comment.profile_username}
                              </Link>
                              {comment.profile_is_verified && <VerifiedBadge size={10} />}
                              <span className="text-xs text-[#A8A8A8]">
                                {formatTimeAgo(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-white mt-0.5 leading-[1.4] break-words">
                              {comment.text}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs text-[#A8A8A8]">
                                Mi piace: {comment.likes_count}
                              </span>
                              <button className="text-xs text-[#A8A8A8] font-semibold hover:text-white">
                                Rispondi
                              </button>
                            </div>
                            {comment.replies && comment.replies.length > 0 && (
                              <button className="flex items-center gap-2 mt-2 text-xs text-[#A8A8A8] hover:text-white">
                                <span className="w-5 h-[1px] bg-[#A8A8A8]"></span>
                                Visualizza tutte le {comment.replies.length} risposte
                              </button>
                            )}
                          </div>
                          <button 
                            onClick={() => handleCommentLike(comment.id)} 
                            className="flex-shrink-0 mt-1"
                          >
                            <Heart 
                              className={`w-3.5 h-3.5 ${
                                comment.is_liked_by_current_user 
                                  ? 'fill-[#ED4956] text-[#ED4956]' 
                                  : 'text-[#A8A8A8]'
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input Nuovo Commento Mobile */}
            <div className="border-t border-[#363636] px-3 py-2.5 pb-4">
              <div className="flex items-center gap-2.5">
                <ProfilePicture src={null} alt="You" size={28} />
                <input 
                  type="text" 
                  placeholder="Aggiungi un commento..." 
                  value={commentText} 
                  onChange={(e) => setCommentText(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} 
                  className="flex-1 bg-transparent text-sm text-white placeholder-[#A8A8A8] outline-none" 
                />
                <button 
                  onClick={handleCommentSubmit} 
                  disabled={isSubmittingComment || !commentText.trim()} 
                  className="font-semibold text-sm hover:underline disabled:opacity-30 transition-opacity text-[#0095F6]"
                >
                  {isSubmittingComment ? 'Invio...' : 'Pubblica'}
                </button>
                <button className="text-[#A8A8A8] hover:text-white transition-colors">
                  <svg aria-label="Emoji" fill="currentColor" height="24" role="img" viewBox="0 0 24 24" width="24">
                    <title>Emoji</title>
                    <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CSS Animazioni Globali */}
      {/* -------------------------------------------------------------------- */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        @keyframes popIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
