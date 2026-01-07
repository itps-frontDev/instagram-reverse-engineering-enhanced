/**
 * @fileoverview Sidebar di navigazione principale (desktop).
 *
 * Contiene il logo, i link di navigazione e le azioni principali.
 */

'use client';

import Link from 'next/link';
import ProfilePicture from '@/components/ProfilePicture';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import CreatePostModal from '@/components/feed/CreatePostModal';
import SearchPanel from '@/components/layout/SearchPanel';
import NotificationsPanel from '@/components/layout/NotificationsPanel';
import ShareIcon from '@/components/common/ShareIcon';
import {
  Home,
  Search,
  Compass,
  Film,
  Heart,
  PlusSquare,
  Menu,
  Instagram,
} from 'lucide-react';

type NavItem = {
  icon: string | any;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Carica il conteggio delle notifiche non lette
  useEffect(() => {
    if (!profile) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unread notifications:', error);
      }
    };

    const fetchUnreadChats = async () => {
      try {
        const response = await fetch('/api/direct/chats');
        if (response.ok) {
          const data = await response.json();
          const chats = data.chats || [];
          // Conta le chat con messaggi non letti
          // Non mostrare il badge se l'utente è già sulla pagina dei messaggi
          if (!pathname.startsWith('/direct')) {
            // Ottieni le chat lette da localStorage
            const readChats = JSON.parse(localStorage.getItem('readChats') || '{}');
            
            const unread = chats.filter((chat: any) => {
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
        }
      } catch (error) {
        console.error('Error fetching unread chats:', error);
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
      {/* Overlay per chiudere i pannelli */}
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
        onMarkAllAsRead={() => setUnreadCount(0)}
      />
      
      <aside className={`hidden lg:flex fixed left-0 top-0 h-screen flex-col ${
        isProfilePage ? '' : 'border-r border-[#DBDBDB] dark:border-[#262626]'
      } bg-[var(--bg-primary)] py-8 px-3 transition-all duration-300 ${
        isCollapsed ? 'w-[80px]' : 'lg:w-[80px] xl:w-[336px]'
      }`}>
        
      {/* Instagram Logo */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/" className="flex items-center justify-center xl:justify-start">
          {/* Instagram Wordmark - XL screens (solo se non è collapsed) */}
          {!isCollapsed && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Instagram"
              role="img"
              viewBox="32 4 113 32"
              width="103"
              height="29"
              className="hidden xl:block text-[#262626] dark:text-white"
            >
              <path
                clipRule="evenodd"
                fillRule="evenodd"
                fill="currentColor"
                d="M37.82 4.11c-2.32.97-4.86 3.7-5.66 7.13-1.02 4.34 3.21 6.17 3.56 5.57.4-.7-.76-.94-1-3.2-.3-2.9 1.05-6.16 2.75-7.58.32-.27.3.1.3.78l-.06 14.46c0 3.1-.13 4.07-.36 5.04-.23.98-.6 1.64-.33 1.9.32.28 1.68-.4 2.46-1.5a8.13 8.13 0 0 0 1.33-4.58c.07-2.06.06-5.33.07-7.19 0-1.7.03-6.71-.03-9.72-.02-.74-2.07-1.51-3.03-1.1Zm82.13 14.48a9.42 9.42 0 0 1-.88 3.75c-.85 1.72-2.63 2.25-3.39-.22-.4-1.34-.43-3.59-.13-5.47.3-1.9 1.14-3.35 2.53-3.22 1.38.13 2.02 1.9 1.87 5.16ZM96.8 28.57c-.02 2.67-.44 5.01-1.34 5.7-1.29.96-3 .23-2.65-1.72.31-1.72 1.8-3.48 4-5.64l-.01 1.66Zm-.35-10a10.56 10.56 0 0 1-.88 3.77c-.85 1.72-2.64 2.25-3.39-.22-.5-1.69-.38-3.87-.13-5.25.33-1.78 1.12-3.44 2.53-3.44 1.38 0 2.06 1.5 1.87 5.14Zm-13.41-.02a9.54 9.54 0 0 1-.87 3.8c-.88 1.7-2.63 2.24-3.4-.23-.55-1.77-.36-4.2-.13-5.5.34-1.95 1.2-3.32 2.53-3.2 1.38.14 2.04 1.9 1.87 5.13Zm61.45 1.81c-.33 0-.49.35-.61.93-.44 2.02-.9 2.48-1.5 2.48-.66 0-1.26-1-1.42-3-.12-1.58-.1-4.48.06-7.37.03-.59-.14-1.17-1.73-1.75-.68-.25-1.68-.62-2.17.58a29.65 29.65 0 0 0-2.08 7.14c0 .06-.08.07-.1-.06-.07-.87-.26-2.46-.28-5.79 0-.65-.14-1.2-.86-1.65-.47-.3-1.88-.81-2.4-.2-.43.5-.94 1.87-1.47 3.48l-.74 2.2.01-4.88c0-.5-.34-.67-.45-.7a9.54 9.54 0 0 0-1.8-.37c-.48 0-.6.27-.6.67 0 .05-.08 4.65-.08 7.87v.46c-.27 1.48-1.14 3.49-2.09 3.49s-1.4-.84-1.4-4.68c0-2.24.07-3.21.1-4.83.02-.94.06-1.65.06-1.81-.01-.5-.87-.75-1.27-.85-.4-.09-.76-.13-1.03-.11-.4.02-.67.27-.67.62v.55a3.71 3.71 0 0 0-1.83-1.49c-1.44-.43-2.94-.05-4.07 1.53a9.31 9.31 0 0 0-1.66 4.73c-.16 1.5-.1 3.01.17 4.3-.33 1.44-.96 2.04-1.64 2.04-.99 0-1.7-1.62-1.62-4.4.06-1.84.42-3.13.82-4.99.17-.8.04-1.2-.31-1.6-.32-.37-1-.56-1.99-.33-.7.16-1.7.34-2.6.47 0 0 .05-.21.1-.6.23-2.03-1.98-1.87-2.69-1.22-.42.39-.7.84-.82 1.67-.17 1.3.9 1.91.9 1.91a22.22 22.22 0 0 1-3.4 7.23v-.7c-.01-3.36.03-6 .05-6.95.02-.94.06-1.63.06-1.8 0-.36-.22-.5-.66-.67-.4-.16-.86-.26-1.34-.3-.6-.05-.97.27-.96.65v.52a3.7 3.7 0 0 0-1.84-1.49c-1.44-.43-2.94-.05-4.07 1.53a10.1 10.1 0 0 0-1.66 4.72c-.15 1.57-.13 2.9.09 4.04-.23 1.13-.89 2.3-1.63 2.3-.95 0-1.5-.83-1.5-4.67 0-2.24.07-3.21.1-4.83.02-.94.06-1.65.06-1.81 0-.5-.87-.75-1.27-.85-.42-.1-.79-.13-1.06-.1-.37.02-.63.35-.63.6v.56a3.7 3.7 0 0 0-1.84-1.49c-1.44-.43-2.93-.04-4.07 1.53-.75 1.03-1.35 2.17-1.66 4.7a15.8 15.8 0 0 0-.12 2.04c-.3 1.81-1.61 3.9-2.68 3.9-.63 0-1.23-1.21-1.23-3.8 0-3.45.22-8.36.25-8.83l1.62-.03c.68 0 1.29.01 2.19-.04.45-.02.88-1.64.42-1.84-.21-.09-1.7-.17-2.3-.18-.5-.01-1.88-.11-1.88-.11s.13-3.26.16-3.6c.02-.3-.35-.44-.57-.53a7.77 7.77 0 0 0-1.53-.44c-.76-.15-1.1 0-1.17.64-.1.97-.15 3.82-.15 3.82-.56 0-2.47-.11-3.02-.11-.52 0-1.08 2.22-.36 2.25l3.2.09-.03 6.53v.47c-.53 2.73-2.37 4.2-2.37 4.2.4-1.8-.42-3.15-1.87-4.3-.54-.42-1.6-1.22-2.79-2.1 0 0 .69-.68 1.3-2.04.43-.96.45-2.06-.61-2.3-1.75-.41-3.2.87-3.63 2.25a2.61 2.61 0 0 0 .5 2.66l.15.19c-.4.76-.94 1.78-1.4 2.58-1.27 2.2-2.24 3.95-2.97 3.95-.58 0-.57-1.77-.57-3.43 0-1.43.1-3.58.19-5.8.03-.74-.34-1.16-.96-1.54a4.33 4.33 0 0 0-1.64-.69c-.7 0-2.7.1-4.6 5.57-.23.69-.7 1.94-.7 1.94l.04-6.57c0-.16-.08-.3-.27-.4a4.68 4.68 0 0 0-1.93-.54c-.36 0-.54.17-.54.5l-.07 10.3c0 .78.02 1.69.1 2.09.08.4.2.72.36.91.15.2.33.34.62.4.28.06 1.78.25 1.86-.32.1-.69.1-1.43.89-4.2 1.22-4.31 2.82-6.42 3.58-7.16.13-.14.28-.14.27.07l-.22 5.32c-.2 5.37.78 6.36 2.17 6.36 1.07 0 2.58-1.06 4.2-3.74l2.7-4.5 1.58 1.46c1.28 1.2 1.7 2.36 1.42 3.45-.21.83-1.02 1.7-2.44.86-.42-.25-.6-.44-1.01-.71-.23-.15-.57-.2-.78-.04-.53.4-.84.92-1.01 1.55-.17.61.45.94 1.09 1.22.55.25 1.74.47 2.5.5 2.94.1 5.3-1.42 6.94-5.34.3 3.38 1.55 5.3 3.72 5.3 1.45 0 2.91-1.88 3.55-3.72.18.75.45 1.4.8 1.96 1.68 2.65 4.93 2.07 6.56-.18.5-.69.58-.94.58-.94a3.07 3.07 0 0 0 2.94 2.87c1.1 0 2.23-.52 3.03-2.31.09.2.2.38.3.56 1.68 2.65 4.93 2.07 6.56-.18l.2-.28.05 1.4-1.5 1.37c-2.52 2.3-4.44 4.05-4.58 6.09-.18 2.6 1.93 3.56 3.53 3.69a4.5 4.5 0 0 0 4.04-2.11c.78-1.15 1.3-3.63 1.26-6.08l-.06-3.56a28.55 28.55 0 0 0 5.42-9.44s.93.01 1.92-.05c.32-.02.41.04.35.27-.07.28-1.25 4.84-.17 7.88.74 2.08 2.4 2.75 3.4 2.75 1.15 0 2.26-.87 2.85-2.17l.23.42c1.68 2.65 4.92 2.07 6.56-.18.37-.5.58-.94.58-.94.36 2.2 2.07 2.88 3.05 2.88 1.02 0 2-.42 2.78-2.28.03.82.08 1.49.16 1.7.05.13.34.3.56.37.93.34 1.88.18 2.24.11.24-.05.43-.25.46-.75.07-1.33.03-3.56.43-5.21.67-2.79 1.3-3.87 1.6-4.4.17-.3.36-.35.37-.03.01.64.04 2.52.3 5.05.2 1.86.46 2.96.65 3.3.57 1 1.27 1.05 1.83 1.05.36 0 1.12-.1 1.05-.73-.03-.31.02-2.22.7-4.96.43-1.79 1.15-3.4 1.41-4 .1-.21.15-.04.15 0-.06 1.22-.18 5.25.32 7.46.68 2.98 2.65 3.32 3.34 3.32 1.47 0 2.67-1.12 3.07-4.05.1-.7-.05-1.25-.48-1.25Z"
              />
            </svg>
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

          if (item.action === 'create') {
            return (
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

          if (item.action === 'search') {
            return (
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

          if (item.action === 'notifications') {
            return (
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

          return (
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