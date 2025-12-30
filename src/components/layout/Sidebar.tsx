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
  { icon: 'custom-home', label: 'Home', href: '/' },
  { icon: 'custom-search', label: 'Cerca', href: '/search' },
  { icon: 'custom-explore', label: 'Esplora', href: '/explore' },
  { icon: 'custom-reels', label: 'Reels', href: '/reels' },
  { icon: 'custom-message', label: 'Messaggi', href: '/direct' },
  { icon: Heart, label: 'Notifiche', href: '/notifications' },
  { icon: 'custom-create', label: 'Crea', href: '/create' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, isLoading, logout } = useAuth();
  const [showMore, setShowMore] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen lg:w-[80px] xl:w-[336px] flex-col border-r border-[#DBDBDB] dark:border-[#262626] bg-[var(--bg-primary)] py-8 px-3 transition-all duration-300">
      {/* Instagram Logo */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/" className="flex items-center justify-center xl:justify-start">
          <h1
            className="hidden xl:block text-[29px] font-normal tracking-tight text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-instagram)' }}
          >
            Instagram
          </h1>
          <svg className="xl:hidden w-8 h-8" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.397 2.5h21.206c6.006 0 10.897 4.891 10.897 10.897v21.206c0 6.006-4.891 10.897-10.897 10.897H13.397C7.391 45.5 2.5 40.609 2.5 34.603V13.397C2.5 7.391 7.391 2.5 13.397 2.5z" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="24" cy="24" r="7.5" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="35.5" cy="12.5" r="1.5" fill="currentColor"/>
          </svg>
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
                    <>
                      <path d="M12 2.5 L2 10 L2 21 Q2 22 3 22 L9.5 22 L9.5 14.5 Q9.5 13 12 13 Q14.5 13 14.5 14.5 L14.5 22 L21 22 Q22 22 22 21 L22 10 L12 2.5 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    </>
                  )}
                </svg>
              ) : item.icon === 'custom-search' ? (
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? "3" : "2"}
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
                <svg
                  className={`w-[26px] h-[26px] text-[#262626] dark:text-white`}
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ transform: 'rotate(13deg)' }}
                >
                  {isActive ? (
                    <>
                      <path d="M21.5 2.5Q18 12 15.5 20Q15 21.5 14 21Q12.5 17 11 13Q7 11.5 3 10Q2 9 2.5 8.5Q11 5.5 21.5 2.5Z" fill="currentColor"/>
                      <path d="M16 7Q14 9.5 11.5 11.5" stroke="#000000" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  ) : (
                    <>
                      <path d="M21.5 2.5Q16 8 11 13" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M21.5 2.5Q18 12 15.5 20Q15 21.5 14 21Q12.5 17 11 13Q7 11.5 3 10Q2 9 2.5 8.5Q11 5.5 21.5 2.5Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </>
                  )}
                </svg>
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
              <span className="hidden xl:block text-base text-[#262626] dark:text-white">{item.label}</span>
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
            <span className="hidden xl:block text-base text-[#262626] dark:text-white">Profilo</span>
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
          <span className="hidden xl:block text-base text-[#262626] dark:text-white">Altro</span>
        </button>

        {/* Popup Menu */}
        {showMore && (
          <div
            ref={moreRef}
            className="absolute bottom-full lg:left-12 xl:left-3 mb-2 w-[260px] bg-white dark:bg-[#262626] border border-[#DBDBDB] dark:border-[#363636] rounded-2xl shadow-lg py-2 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              className="w-full text-left py-3 px-4 text-[#262626] dark:text-white hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition"
              onClick={() => { setShowMore(false); router.push('/settings'); }}
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
          </div>
        )}

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
      </div>
    </aside>
    </>
  );
}
