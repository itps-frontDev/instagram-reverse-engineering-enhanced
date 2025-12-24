/**
 * @fileoverview Navigation bar mobile (bottom).
 * 
 * Barra di navigazione fissa in basso per dispositivi mobili.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusSquare, Film, User } from 'lucide-react';

const navItems = [
  { icon: Home, href: '/' },
  { icon: Search, href: '/explore' },
  { icon: PlusSquare, href: '/create' },
  { icon: Film, href: '/reels' },
  { icon: User, href: '/profile/username' },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#0c1014] border-t border-gray-200 dark:border-neutral-800 z-50">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center w-full h-full"
            >
              <Icon
                className={`w-6 h-6 dark:text-white ${
                  isActive ? 'stroke-[2.5]' : 'stroke-2'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
