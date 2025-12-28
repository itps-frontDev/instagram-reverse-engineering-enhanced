/**
 * @fileoverview Sidebar di navigazione principale (desktop).
 *
 * Contiene il logo, i link di navigazione e le azioni principali.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
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
  { icon: PlusSquare, label: 'Crea', href: '/create' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, isLoading } = useAuth();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-[245px] flex-col border-r border-[#DBDBDB] dark:border-[#262626] bg-white dark:bg-[#0c1014] py-8 px-3">
      {/* Instagram Logo */}
      <div className="mb-8 px-3 pt-2">
        <Link href="/">
          <h1
            className="text-[29px] font-normal tracking-tight text-[#262626] dark:text-white"
            style={{ fontFamily: 'var(--font-instagram)' }}
          >
            Instagram
          </h1>
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'font-bold'
                  : 'font-normal hover:bg-[#F2F2F2] dark:hover:bg-[#121212]'
              }`}
            >
              <Icon
                className={`w-[26px] h-[26px] ${
                  isActive ? 'stroke-[2.5]' : 'stroke-2'
                } text-[#262626] dark:text-white`}
              />
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
            <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              {profile.profile_image_url ? (
                <img
                  src={profile.profile_image_url}
                  alt={profile.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-xs font-semibold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-base text-[#262626] dark:text-white">Profilo</span>
          </Link>
        )}
      </nav>

      {/* More Menu */}
      <button className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-[#F2F2F2] dark:hover:bg-[#121212] transition-all duration-200">
        <Menu className="w-[26px] h-[26px] text-[#262626] dark:text-white" />
        <span className="text-base text-[#262626] dark:text-white">Altro</span>
      </button>
    </aside>
  );
}
