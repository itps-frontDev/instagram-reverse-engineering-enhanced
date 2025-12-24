/**
 * @fileoverview Sidebar di navigazione principale (desktop).
 * 
 * Contiene il logo, i link di navigazione e le azioni principali.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <aside className="hidden lg:flex fixed left-5 top-0 h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0c1014] py-8">
      {/* Instagram Logo */}
      <div className="mb-9 px-1">
        <Link href="/">
          <h1 className="text-3xl font-normal tracking-tight dark:text-white" style={{ fontFamily: 'var(--font-instagram)' }}>Instagram</h1>
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
              className={`flex items-center gap-4 px-1 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'font-bold'
                  : 'font-normal hover:bg-gray-100 dark:hover:bg-gray-900'
              }`}
            >
              <Icon
                className={`w-7 h-7 ${isActive ? 'stroke-[2.5]' : 'stroke-2'} dark:text-white`}
              />
              <span className="text-base dark:text-white">{item.label}</span>
            </Link>
          );
        })}

        {/* Profile Link */}
        <Link
          href="/profile/username"
          className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
          <span className="text-base dark:text-white">Profilo</span>
        </Link>
      </nav>

      {/* More Menu */}
      <button className="flex items-center gap-4 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
        <Menu className="w-7 h-7 dark:text-white" />
        <span className="text-base dark:text-white">Altro</span>
      </button>
    </aside>
  );
}
