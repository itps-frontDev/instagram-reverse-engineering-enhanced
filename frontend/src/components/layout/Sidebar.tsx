/**
 * @fileoverview Sidebar di navigazione principale (desktop).
 *
 * Contiene il logo, i link di navigazione e le azioni principali.
 * 
 * FUNZIONALITÀ:
 * - Logo Instagram (espanso/collapsed)
 * - Link: Home, Cerca, Esplora, Reels, Messaggi, Notifiche, Crea, Profilo
 * - Menu "Altro" con impostazioni e logout
 * - Badge conteggio notifiche e chat non lette
 * - Stati collapsed per Direct e pannelli laterali
 * - Toggle tema chiaro/scuro
 * - Modal creazione post
 * - Pannelli Ricerca e Notifiche
 * 
 * @module components/layout/Sidebar
 */

'use client';

import Link from 'next/link';
import ProfilePicture from '@/components/ProfilePicture';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {CreatePostModal} from '@/components/feed';
import {SearchPanel, NotificationsPanel} from '@/components/layout';
import { ShareIcon, InstagramLogo } from '@/components/common';
import { getUnreadCountAction } from '@/features/notifications/actions';
import {
  Heart,
  Menu,
  Instagram,
  LucideIcon,
} from 'lucide-react';

type NavItem = {
  icon: string | LucideIcon;
  label: string;
  href?: string;
  action?: string;
};

const navItems: NavItem[] = [
  { icon: 'custom-home', label: 'Home', href: '/' },
  { icon: 'custom-search', label: 'Cerca', action: 'search' },
  { icon: 'custom-explore', label: 'Esplora', href: '/explore' },
  { icon: 'custom-reels', label: 'Reels', href: '/reels' },
  { icon: 'custom-message', label: 'Messaggi', href: '/direct' },
  { icon: Heart, label: 'Notifiche', action: 'notifications' },
  { icon: 'custom-create', label: 'Crea', action: 'create' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, isLoading, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isDirectPage = pathname.startsWith('/direct');
  const isProfilePage = pathname.startsWith('/profile/');
  const isCollapsed = isDirectPage || showSearchPanel || showNotificationsPanel;

  // Stabile: non ricrea la reference ad ogni render, evita loop in NotificationsPanel
  const handleMarkAllAsRead = useCallback(() => setUnreadCount(0), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Carica il conteggio delle notifiche non lette
  useEffect(() => {
    if (!profile) return;

    // Funzione per caricare il conteggio delle notifiche non lette
    const fetchUnreadCount = async () => {
      try {
        const result = await getUnreadCountAction();
        if (result.success) {
          setUnreadCount(result.data.count || 0);
          return;
        }
        if (result.error !== 'Authentication required.' && result.error !== 'Missing access token.') {
          console.error('Error fetching unread notifications:', result.error);
        }
      } catch (error) {
        // Silent fail - network errors shouldn't break the UI
        // Log solo se non è un errore di fetch
        if (error instanceof Error && error.message !== 'Failed to fetch') {
          console.error('Error fetching unread notifications:', error);
        }
      }
    };

    // Carica il conteggio delle chat con messaggi non letti
    const fetchUnreadChats = async () => {
      try {
        const response = await fetch('/api/direct/chats');
        if (!response.ok) {
          // Silent fail - don't log on auth errors
          if (response.status !== 401) {
            console.error('Error fetching chats:', response.status);
          }
          return;
        }
        const data = await response.json();
        const chats = data.chats || [];
        // Conta le chat con messaggi non letti
        // Non mostrare il badge se l'utente è già sulla pagina dei messaggi
        if (!pathname.startsWith('/direct')) {
          // Ottieni le chat lette da localStorage
          const readChats = JSON.parse(localStorage.getItem('readChats') || '{}');
          
          const unread = chats.filter((chat: { id: number; last_message_text?: string; last_message_at?: string | number; isFromMe?: boolean }) => {
            // Ignora chat senza messaggi
            if (!chat.last_message_text || !chat.last_message_at) return false;
            
            // Ignora messaggi inviati da me
            if (chat.isFromMe) return false;
            
            // Usa solo l'ID della chat come chiave
            const chatKey = `chat_${chat.id}`;
            const lastReadTime = readChats[chatKey] || 0;
            
            // Converti last_message_at in timestamp se è una stringa datetime
            let lastMessageTime: number;
            if (typeof chat.last_message_at === 'number') {
              lastMessageTime = chat.last_message_at;
            } else {
              lastMessageTime = new Date(chat.last_message_at).getTime();
            }
            
            console.log('[Sidebar] Chat:', chat.id, 'LastMsg:', lastMessageTime, 'LastRead:', lastReadTime, 'Unread:', lastMessageTime > lastReadTime);
            
            return lastMessageTime > lastReadTime;
          }).length;
          
          setUnreadChatsCount(unread);
        } else {
          setUnreadChatsCount(0);
        }
      } catch (error) {
        // Silent fail on network errors
        if (error instanceof Error && error.message !== 'Failed to fetch') {
          console.error('Error fetching unread chats:', error);
        }
      }
    };

    fetchUnreadCount();
    fetchUnreadChats();

    // Poll ogni 5 secondi per messaggi
    const interval = setInterval(() => {
      fetchUnreadCount();
      fetchUnreadChats();
    }, 5000);

    return () => clearInterval(interval);
  }, [profile, pathname]);

  // Chiudi il popup cliccando fuori
  useEffect(() => {
    if (!showMore) return;
    function handleClick(e: MouseEvent) {
      if (
        moreRef.current &&
        !moreRef.current.contains(e.target as Node) &&
        moreButtonRef.current &&
        !moreButtonRef.current.contains(e.target as Node)
      ) {
        setShowMore(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMore]);

  return (
    <>
      {/* Overlay <div> trasparente per chiudere i pannelli al click al di fuori da essi */}
      {(showSearchPanel || showNotificationsPanel) && (
        <div 
          className="fixed inset-0 bg-transparent z-30"
          onClick={() => {
            setShowSearchPanel(false);
            setShowNotificationsPanel(false);
          }}
        />
      )}
      
      {/* Search Panel */}
      <SearchPanel isOpen={showSearchPanel} onClose={() => setShowSearchPanel(false)} />
      
      {/* Notifications Panel */}
      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
      
      {/* Sidebar */}
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen flex-col ${
        isProfilePage ? '' : 'border-r border-[#DBDBDB] dark:border-[#262626]'
      } bg-[var(--bg-primary)] py-8 px-3 transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'lg:w-[80px] xl:w-[336px]'
      }`}>
        
      {/* Logo Instagram - riutilizza il componente comune */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/" className="flex items-center justify-center xl:justify-start">
          {/* Instagram Wordmark - XL screens (solo se non è collapsed) */}
          {!isCollapsed && (
            <InstagramLogo 
              width={103} 
              height={29} 
              className="hidden xl:block text-[#262626] dark:text-white" 
            />
          )}

          {/* Instagram Logo Icon - sempre visibile quando collapsed, oppure su LG (non XL) */}
          <Instagram 
            className={`${isCollapsed ? 'block' : 'xl:hidden'} w-7 h-7 text-[#262626] dark:text-white`}
          />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          // Se i pannelli laterali sono aperti, solo quell'azione è attiva
          let isActive = false;
          if (showSearchPanel && item.action === 'search') {
            isActive = true;
          } else if (showNotificationsPanel && item.action === 'notifications') {
            isActive = true;
          } else if (!showSearchPanel && !showNotificationsPanel && pathname === item.href) {
            // Solo quando nessun pannello è aperto, usa il pathname
            isActive = true;
          }

          // Costruzione del contenuto icona + label
          const content = (
            <>
              {item.icon === 'custom-home' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isActive ? (
                    <>
                      <path d="M12 2.5 L2 10 L2 21 Q2 22 3 22 L9.5 22 L9.5 14.5 Q9.5 13 12 13 Q14.5 13 14.5 14.5 L14.5 22 L21 22 Q22 22 22 21 L22 10 L12 2.5 Z" fill="currentColor"/>
                      <path d="M9.5 14.5 L9.5 22.5 L14.5 22.5 L14.5 14.5 Q14.5 13 12 13 Q9.5 13 9.5 14.5 Z" fill="var(--bg-primary)"/>
                    </>
                  ) : (
                    <path d="M12 2.5 L2 10 L2 21 Q2 22 3 22 L9.5 22 L9.5 14.5 Q9.5 13 12 13 Q14.5 13 14.5 14.5 L14.5 22 L21 22 Q22 22 22 21 L22 10 L12 2.5 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  )}
                </svg>
              ) : item.icon === 'custom-search' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={showSearchPanel ? "3" : "2"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              ) : item.icon === 'custom-create' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 11h-8V3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2Z" />
                </svg>
              ) : item.icon === 'custom-message' ? (
                <div className="relative">
                  <ShareIcon size={26} className="text-[#262626] dark:text-white" filled={isActive} />
                  {unreadChatsCount > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                    </div>
                  )}
                </div>
              ) : item.icon === 'custom-reels' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isActive ? (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="currentColor"/>
                      <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="var(--bg-primary)"/>
                    </>
                  ) : (
                    <>
                      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M9 8 Q9.5 8 10 8.5 L16 11.5 Q16.5 12 16.5 12 Q16.5 12 16 12.5 L10 15.5 Q9.5 16 9 16 Q9 16 9 15.5 L9 8.5 Q9 8 9 8" fill="none" stroke="currentColor" strokeWidth="2"/>
                    </>
                  )}
                </svg>
              ) : item.icon === 'custom-explore' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {isActive ? (
                    <>
                      <circle cx="12" cy="12" r="10" fill="currentColor"/>
                      <polygon points="16.24 7.76 14.12 14.12 12 12 9.88 9.88 16.24 7.76" fill="none" stroke="var(--bg-primary)" strokeWidth="2"/>
                      <polygon points="12 12 15 15 7.76 16.24 9 9 12 12" fill="var(--bg-primary)" stroke="none"/>
                    </>
                  ) : (
                    <>
                      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <polygon points="16.24 7.76 14.12 14.12 12 12 9.88 9.88 16.24 7.76" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <polygon points="12 12 15 15 7.76 16.24 9 9 12 12" fill="currentColor" stroke="none"/>
                    </>
                  )}
                </svg>
              ) : (
                <item.icon
                  className={`w-[26px] h-[26px] ${
                    isActive ? 'fill-current' : ''
                  } text-[#262626] dark:text-white`}
                  fill={isActive ? 'currentColor' : 'none'}
                />
              )}
              {!isCollapsed && (
                <span className="hidden xl:block text-base text-[#262626] dark:text-white">{item.label}</span>
              )}
              {/* Badge notifiche non lette */}
              {item.action === 'notifications' && unreadCount > 0 && (
                <div className="absolute top-2.75 left-7.5 w-3 h-3 bg-[#FF3B30] rounded-full border-2 border-white dark:border-black" />
              )}
            </>
          );


          // Bottone per la creazione post
          if (item.action === 'create') {
            // Pulsante "Crea Post"
            return (
              // Button: Crea Post
              <button
                key={item.action}
                onClick={() => setShowCreateModal(true)}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left ${
                  isActive
                    ? 'font-bold'
                    : 'font-normal hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {content}
              </button>
            );
          }

          // Bottone per la ricerca
          if (item.action === 'search') {
            // Pulsante "Cerca"
            return (
              // Button: Cerca
              <button
                key={item.action}
                onClick={() => {
                  setShowSearchPanel(!showSearchPanel);
                  setShowNotificationsPanel(false);
                }}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left relative ${
                  showSearchPanel
                    ? 'font-bold'
                    : 'font-normal hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {content}
              </button>
            );
          }

          // Bottone per le notifiche
          if (item.action === 'notifications') {
            // Pulsante "Notifiche"
            return (
              // Button: Notifiche
              <button
                key={item.action}
                onClick={() => {
                  setShowNotificationsPanel(!showNotificationsPanel);
                  setShowSearchPanel(false);
                }}
                className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full text-left relative ${
                  showNotificationsPanel
                    ? 'font-bold'
                    : 'font-normal hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {content}
              </button>
            );
          }

          // Link di navigazione generico per voci con href
          return (
            // Link di navigazione
            <Link
              key={item.href}
              href={item.href!}
              onClick={() => {
                // Chiudi i pannelli laterali quando si naviga
                setShowSearchPanel(false);
                setShowNotificationsPanel(false);
              }}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'font-bold'
                  : 'font-normal hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {content}
            </Link>
          );
        })}

        {/* Profile Link */}
        {!isLoading && profile && (
          <Link
            href={`/profile/${profile.username}`}
            onClick={() => {
              // Chiudi i pannelli laterali quando si naviga
              setShowSearchPanel(false);
              setShowNotificationsPanel(false);
            }}
            className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
              pathname.startsWith(`/profile/${profile.username}`)
                ? 'font-bold'
                : 'font-normal hover:bg-[#F2F2F2] dark:hover:bg-[#121212]'
            }`}
          >
            <div className="w-[26px] h-[26px] flex items-center justify-center">
              <div 
                className={`rounded-full ${pathname.startsWith(`/profile/${profile.username}`) ? 'ring-2 ring-[rgb(12,16,20)] dark:ring-[rgb(245,245,245)]' : ''}`}
                style={{
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ProfilePicture
                  src={profile.profile_image_url}
                  alt={profile.username}
                  size={24}
                  className="sidebar-pfp"
                />
              </div>
            </div>
            {!isCollapsed && (
              <span className="hidden xl:block text-base text-[#262626] dark:text-white">Profilo</span>
            )}
          </Link>
        )}
      </nav>

      {/* More Menu */}
      <div className="relative">
        <button
          ref={moreButtonRef}
          className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 w-full ${showMore ? 'font-bold bg-[var(--bg-tertiary)]' : 'font-normal hover:bg-[var(--bg-tertiary)]'}`}
          onMouseDown={e => {
            e.stopPropagation();
            setShowMore(prev => !prev);
          }}
          aria-haspopup="true"
          aria-expanded={showMore}
        >
          <Menu className="w-[26px] h-[26px] text-[#262626] dark:text-white" />
          {!isCollapsed && (
            <span className="hidden xl:block text-base text-[#262626] dark:text-white">Altro</span>
          )}
        </button>

        {/* Popup Menu (portal) */}
        {(typeof window !== 'undefined' && mounted && showMore)
          ? createPortal(
              <div
                ref={moreRef}
                className="fixed left-4 bottom-20 lg:left-16 xl:left-6 z-[1050] w-[260px] bg-white dark:bg-[#262626] border border-[#DBDBDB] dark:border-[#363636] rounded-2xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200"
                style={{ maxWidth: '90vw' }}
              >
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); router.push('/accounts/edit'); }}
                >
                  Impostazioni
                </button>
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); router.push('/your-activity'); }}
                >
                  La tua attività
                </button>
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); router.push('/saved'); }}
                >
                  Elementi salvati
                </button>
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); /* toggle appearance: light/dark */ document.documentElement.classList.toggle('dark'); }}
                >
                  Cambia aspetto
                </button>
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); router.push('/report'); }}
                >
                  Segnala un problema
                </button>
                <div className="border-t border-[#E5E5E5] dark:border-[#333333] my-1" />
                <button
                  className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={() => { setShowMore(false); router.push('/login'); }}
                >
                  Cambia account
                </button>
                <button
                  className="w-full text-left py-3 px-4 text-[#d9534f] dark:text-[#ff6b6b] hover:bg-[#FFF0F0] dark:hover:bg-[#3a1f1f] transition"
                  onClick={() => { setShowLogoutConfirm(true); setShowMore(false); }}
                >
                  Esci
                </button>
              </div>,
              document.body
            )
          : null}

        {/* Logout Confirmation Modal (portal) */}
        {mounted && showLogoutConfirm && createPortal(
          <div className="fixed inset-0 z-[1100] flex items-end sm:items-center justify-center px-4 py-6 sm:p-6">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#262626] rounded-2xl border border-[#DBDBDB] dark:border-[#363636] shadow-lg">
              <div className="px-6 pt-6 pb-3 text-center">
                <h3 className="text-lg font-semibold text-[#262626] dark:text-white">Disconnessione</h3>
                <p className="mt-2 text-sm text-[#777777] dark:text-[#bdbdbd]">Devi effettuare nuovamente l'accesso.</p>
              </div>
              <div className="border-t border-[#E5E5E5] dark:border-[#333333]" />
              <div className="px-6 py-4 text-center">
                <button
                  className="w-full inline-block px-4 py-2 rounded-md bg-transparent text-[#262626] dark:text-white font-semibold hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
                  onClick={async () => {
                    await logout();
                    setShowLogoutConfirm(false);
                    router.push('/login');
                  }}
                >
                  Accedi
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Create Post Modal */}
        {mounted && showCreateModal && createPortal(
          <CreatePostModal 
            isOpen={showCreateModal} 
            onClose={() => setShowCreateModal(false)} 
          />,
          document.body
        )}
      </div>
    </aside>
    </>
  );
}
