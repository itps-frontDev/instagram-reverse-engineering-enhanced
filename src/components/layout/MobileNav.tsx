/**
 * @fileoverview Navigation bar mobile (bottom).
 *
 * Barra di navigazione fissa in basso per dispositivi mobili.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import CreatePostModal from '@/components/feed/CreatePostModal';
import ShareIcon from '@/components/common/ShareIcon';

export default function MobileNav() {
  const pathname = usePathname();
  const { profile, isLoading } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  type NavItem = {
    icon: string;
    href?: string;
    action?: string;
  };

  const navItems: NavItem[] = [
    { icon: 'custom-home', href: '/' },
    { icon: 'custom-explore', href: '/explore' },
    { icon: 'custom-reels', href: '/reels' },
    { icon: 'custom-create', action: 'create' },
    { icon: 'custom-message', href: '/direct' },
  ];

  // Nascondi la navbar se siamo nella home con stories aperte (rilevabile da hash o stato)
  // Per ora la lasciamo visibile, ma potremmo nasconderla con una prop

  return (
    <>
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-primary)] border-t border-gray-700 z-50">
      <div className="flex items-center justify-around h-13">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const content = (
            <>
              {item.icon === 'custom-home' ? (
                <svg
                  className={`w-6 h-6 text-[var(--text-primary)]`}
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
              ) : item.icon === 'custom-explore' ? (
                <svg
                  className={`w-6 h-6 text-[var(--text-primary)]`}
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
              ) : item.icon === 'custom-reels' ? (
                <svg
                  className={`w-6 h-6 text-[var(--text-primary)]`}
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
              ) : item.icon === 'custom-create' ? (
                <svg
                  className={`w-6 h-6 text-[var(--text-primary)]`}
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M21 11h-8V3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2Z" />
                </svg>
              ) : item.icon === 'custom-message' ? (
                <ShareIcon size={24} className="text-[var(--text-primary)]" filled={isActive} />
              ) : null}
            </>
          );

          if (item.action === 'create') {
            return (
              <button
                key={item.action}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center w-full h-full"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className="flex items-center justify-center w-full h-full"
            >
              {content}
            </Link>
          );
        })}

        {/* Profile Link */}
        {!isLoading && profile && (
          <Link
            href={`/profile/${profile.username}`}
            className="flex items-center justify-center w-full h-full"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
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
          </Link>
        )}
      </div>
    </nav>

    {/* Create Post Modal */}
    {mounted && showCreateModal && createPortal(
      <CreatePostModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />,
      document.body
    )}
    </>
  );
}
