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
import {
  Home,
  Search,
  Compass,
  Film,
  MessageCircle,
  Heart,
  PlusSquare,
  Menu,
} from 'lucide-react';

const navItems = [
  { icon: Home, label: 'Home', href: '/' },
  { icon: Search, label: 'Cerca', href: '/search' },
  { icon: Compass, label: 'Esplora', href: '/explore' },
  { icon: Film, label: 'Reels', href: '/reels' },
  { icon: MessageCircle, label: 'Messaggi', href: '/direct' },
  { icon: Heart, label: 'Notifiche', href: '/notifications' },
  { icon: 'custom-create', label: 'Crea', href: '/create' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, isLoading, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  // Chiudi il popup cliccando fuori
  useEffect(() => {
    if (!showMore) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMore]);

  return (
    <>
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[336px] flex-col border-r border-[#DBDBDB] dark:border-[#262626] bg-[var(--bg-primary)] py-8 px-3">
      {/* Instagram Logo */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/">
          <h1
            className="text-[29px] font-normal tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-instagram)' }}
          >
            Instagram
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'font-bold'
                  : 'font-normal hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {item.icon === 'custom-create' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 11h-8V3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2Z" />
                </svg>
              ) : item.icon === 'custom-message' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z" />
                </svg>
              ) : (
                <item.icon
                  className={`w-[26px] h-[26px] ${
                    isActive ? 'stroke-[2.5]' : 'stroke-2'
                  } text-[#262626] dark:text-white`}
                />
              )}
              <span className="text-base text-[#262626] dark:text-white">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile Link */}
        {!isLoading && profile && (
          <Link
            href={`/profile/${profile.username}`}
            className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
              pathname.startsWith(`/profile/${profile.username}`)
                ? 'font-bold'
                : 'font-normal hover:bg-[#F2F2F2] dark:hover:bg-[#121212]'
            }`}
          >
            <div className="w-[26px] h-[26px] flex items-center justify-center">
              <ProfilePicture
                src={profile.profile_image_url}
                alt={profile.username}
                size={26}
              />
            </div>
            <span className="text-base text-[#262626] dark:text-white">Profilo</span>
          </Link>
        )}
      </nav>

      {/* More Menu */}
      <div className="relative">
        <button
          ref={moreButtonRef}
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition-all duration-200 w-full"
          onClick={() => setShowMore(!showMore)}
          aria-haspopup="true"
          aria-expanded={showMore}
        >
          <Menu className="w-[26px] h-[26px] text-[#262626] dark:text-white" />
          <span className="text-base text-[#262626] dark:text-white">Altro</span>
        </button>

        {/* Popup Menu */}
        {showMore && (
          <div
            ref={moreRef}
            className="absolute bottom-full left-3 mb-2 w-[240px] bg-white dark:bg-[#262626] border border-[#DBDBDB] dark:border-[#363636] rounded-2xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
              onClick={() => { logout(); setShowMore(false); }}
            >
              Esci
            </button>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
