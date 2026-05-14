/**
 * @fileoverview Barra di ricerca mobile.
 * 
 * Mostra una barra di ricerca con icona notifiche su dispositivi mobile,
 * posizionata sopra la sezione storie.
 * 
 * FUNZIONALITÀ:
 * - Input ricerca con pannello espandibile
 * - Badge conteggio notifiche non lette
 * - Pagina notifiche fullscreen
 * - Aggiornamento automatico conteggio
 * - Layout responsivo mobile-first
 * 
 * @module components/feed/MobileSearchBar
 */

'use client';

import { useState, useEffect } from 'react';
import { Search, Heart, X, ArrowLeft } from 'lucide-react';
import SearchPanel from '@/components/layout/SearchPanel';
import ProfilePicture from '@/components/ProfilePicture';
import { LoadingSpinner, VerifiedBadge } from '@/components';
import { formatTimeAgo } from '@/lib/date-utils';
import Link from 'next/link';
import { getNotificationsAction, getUnreadCountAction, markAllNotificationsReadAction } from '@/features/notifications/actions';

// ============================================================================
// INTERFACCE
// ============================================================================

/**
 * Struttura di una singola notifica
 * Rappresenta un'interazione ricevuta dall'utente
 */
interface Notification {
  /** Identificativo univoco della notifica */
  id: string;
  /** Tipo di notifica (follow, like_post, comment, etc.) */
  type: string;
  /** ID profilo del mittente */
  sender_profile_id: number | null;
  /** Username del mittente */
  sender_username: string | null;
  /** Nome completo del mittente */
  sender_full_name: string | null;
  /** URL immagine profilo del mittente */
  sender_profile_image_url: string | null;
  /** Se il mittente è verificato */
  sender_is_verified: boolean;
  /** Tipo di riferimento (post, comment, story) */
  reference_type: string | null;
  /** ID dell'elemento di riferimento */
  reference_id: number | null;
  /** Se la notifica è stata letta */
  is_read: boolean;
  /** Data di creazione */
  created_at: string;
}

// ============================================================================
// COMPONENTE PRINCIPALE
// ============================================================================

/**
 * Barra di ricerca mobile con notifiche.
 * 
 * Visibile solo su dispositivi mobile (< lg breakpoint).
 * Posizionata in fixed top, sopra il contenuto della pagina.
 * 
 * STRUTTURA UI:
 * - Barra fissa in alto con pulsante ricerca e icona notifiche
 * - Pannello ricerca espandibile (SearchPanel)
 * - Pagina notifiche fullscreen con lista interazioni
 * 
 * STATI GESTITI:
 * - showSearchPanel: apertura/chiusura pannello ricerca
 * - showNotificationsPage: apertura/chiusura pagina notifiche
 * - unreadCount: conteggio badge notifiche non lette
 * - notifications: array notifiche caricate
 * - isLoading: stato caricamento notifiche
 */
export default function MobileSearchBar() {
  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------
  
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showNotificationsPage, setShowNotificationsPage] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  /**
   * Effect: Polling conteggio notifiche non lette
   * 
   * - Esegue fetch iniziale al mount
   * - Aggiorna ogni 30 secondi per mantenere badge sincronizzato
   * - Cleanup dell'intervallo allo smontaggio
   */
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCountAction();
        if (result.success) {
          setUnreadCount(result.data.count || 0);
        }
      } catch (error) {
        console.error('Errore recupero conteggio non lette:', error);
      }
    };

    fetchUnreadCount();
    
    // Polling ogni 30 secondi
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Effect: Caricamento notifiche all'apertura pagina
   * 
   * Quando showNotificationsPage diventa true:
   * 1. Carica lista completa notifiche
   * 2. Marca tutte come lette (PATCH)
   * 3. Resetta conteggio badge a 0
   */
  useEffect(() => {
    if (!showNotificationsPage) return;

    // Fetch lista notifiche
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const result = await getNotificationsAction({ limit: 50 });
        if (result.success) {
          setNotifications(result.data.notifications || []);
        }
      } catch (error) {
        console.error('Errore caricamento notifiche:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();

    // Marca tutte come lette
    const markAsRead = async () => {
      try {
        const result = await markAllNotificationsReadAction();
        if (result.success) {
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Errore marcatura notifiche come lette:', error);
      }
    };

    markAsRead();
  }, [showNotificationsPage]);

  // --------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // --------------------------------------------------------------------------

  /**
   * Restituisce il testo descrittivo per ogni tipo di notifica.
   * Tradotto in italiano per l'interfaccia utente.
   * 
   * @param notification - Oggetto notifica
   * @returns Stringa descrittiva dell'azione (es. "ha messo mi piace al tuo post")
   */
  const getNotificationText = (notification: Notification): string => {
    switch (notification.type) {
      case 'follow':
        return 'ha iniziato a seguirti';
      case 'follow_request':
        return 'ha richiesto di seguirti';
      case 'follow_accepted':
        return 'ha accettato la tua richiesta di follow';
      case 'like_post':
        return 'ha messo mi piace al tuo post';
      case 'like_comment':
        return 'ha messo mi piace al tuo commento';
      case 'like_story':
        return 'ha messo mi piace alla tua storia';
      case 'comment':
        return 'ha commentato il tuo post';
      case 'comment_reply':
        return 'ha risposto al tuo commento';
      case 'mention_post':
        return 'ti ha menzionato in un post';
      case 'mention_comment':
        return 'ti ha menzionato in un commento';
      case 'mention_story':
        return 'ti ha menzionato in una storia';
      case 'tag':
        return 'ti ha taggato in un post';
      default:
        return 'ha interagito con te';
    }
  };

  /**
   * Genera il link di navigazione per una notifica.
   * 
   * LOGICA ROUTING:
   * - follow/follow_request → pagina profilo mittente
   * - riferimento a post → pagina dettaglio post
   * - altro → nessuna navigazione (#)
   * 
   * @param notification - Oggetto notifica
   * @returns URL di destinazione
   */
  const getNotificationLink = (notification: Notification): string => {
    // Notifiche follow → profilo utente
    if (notification.type === 'follow' || notification.type === 'follow_request') {
      return `/profile/${notification.sender_username}`;
    }
    // Notifiche relative a post → pagina post
    if (notification.reference_type === 'post' && notification.reference_id) {
      return `/p/${notification.reference_id}`;
    }
    return '#';
  };

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <>
      {/* ================================================================== */}
      {/* OVERLAY - Chiude pannello ricerca quando si clicca fuori          */}
      {/* ================================================================== */}
      {showSearchPanel && (
        <div 
          className="fixed inset-0 bg-transparent z-30 lg:hidden"
          onClick={() => setShowSearchPanel(false)}
        />
      )}
      
      {/* ================================================================== */}
      {/* PANNELLO RICERCA - Componente separato con risultati              */}
      {/* ================================================================== */}
      <SearchPanel isOpen={showSearchPanel} onClose={() => setShowSearchPanel(false)} />
      
      {/* ================================================================== */}
      {/* PAGINA NOTIFICHE FULLSCREEN - Visibile solo su mobile             */}
      {/* ================================================================== */}
      {showNotificationsPage && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[var(--bg-secondary)]">
          {/* Header con pulsante indietro */}
          <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[#DBDBDB] dark:border-[#262626] px-6 py-6">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowNotificationsPage(false)}>
                <ArrowLeft className="w-6 h-6 text-[var(--text-primary)]" />
              </button>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Notifiche</h2>
            </div>
          </div>

          {/* Lista notifiche con stati: loading, vuoto, popolato */}
          <div className="overflow-y-auto h-full pb-20">
            {/* Stato: caricamento in corso */}
            {isLoading ? (
              <div className="px-4 py-8 text-center">
                <LoadingSpinner size={24} />
              </div>
            ) : notifications.length === 0 ? (
              /* Stato: nessuna notifica */
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-[#8E8E8E]">
                  Nessuna notifica.
                </p>
              </div>
            ) : (
              <div className="px-2 py-2">
                {notifications.map((notification) => (
                  <Link
                    key={notification.id}
                    href={getNotificationLink(notification)}
                    onClick={() => setShowNotificationsPage(false)}
                    className={`flex items-center gap-3 w-full py-3 px-4 hover:bg-[#F2F2F2] dark:hover:bg-[#121212] active:bg-[#EFEFEF] dark:active:bg-[#1A1A1A] rounded-lg transition ${
                      !notification.is_read ? 'bg-[#F8F9FA] dark:bg-[#1A1A1A]' : ''
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#DBDBDB] dark:bg-[#262626] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {notification.sender_profile_image_url ? (
                        <ProfilePicture
                          src={notification.sender_profile_image_url}
                          alt={notification.sender_username || 'User'}
                          size={44}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400" />
                      )}
                    </div>
                    <div className="flex-1 text-left overflow-hidden">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)]">
                            <span className="font-semibold inline-flex items-center gap-1">
                              {notification.sender_username}
                              {notification.sender_is_verified && (
                                <VerifiedBadge size={12} />
                              )}
                            </span>
                            {' '}
                            <span className="text-[var(--text-primary)]">
                              {getNotificationText(notification)}
                            </span>
                          </p>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {formatTimeAgo(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="w-2 h-2 rounded-full bg-[#0095F6] flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Bar - solo visibile su mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[var(--bg-secondary)] px-3 py-2">
        <div className="flex items-center gap-2 max-w-[470px] mx-auto">
          {/* Pulsante Cerca */}
          <button
            onClick={() => {
              setShowSearchPanel(true);
              setShowNotificationsPage(false);
            }}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-[#EFEFEF] dark:bg-[#262626] rounded-full text-left"
          >
            <Search className="w-4 h-4 text-[#8E8E8E] dark:text-[#A8A8A8]" />
            <span className="text-xl text-[#8E8E8E] dark:text-[#A8A8A8]">Cerca</span>
          </button>

          {/* Pulsante Notifiche */}
          <button
            onClick={() => {
              setShowNotificationsPage(true);
              setShowSearchPanel(false);
            }}
            className="relative p-2"
          >
            <Heart className="w-6 h-6 text-[var(--text-primary)]" />
            {unreadCount > 0 && (
              <div className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#FF3B30] rounded-full flex items-center justify-center">
                <span className="text-[9px] font-semibold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
