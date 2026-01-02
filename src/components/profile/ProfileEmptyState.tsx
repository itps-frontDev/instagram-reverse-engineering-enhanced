/**
 * @fileoverview Profile empty state component
 *
 * Displays appropriate empty state message based on the current tab.
 */

'use client';

import { Bookmark } from 'lucide-react';
import { ProfileTab } from '@/lib/types/profile';
import PostsEmptyIcon from './icons/PostsEmptyIcon';
import TaggedEmptyIcon from './icons/TaggedEmptyIcon';

export interface ProfileEmptyStateProps {
  tab: ProfileTab;
  isOwnProfile: boolean;
}

export default function ProfileEmptyState({
  tab,
  isOwnProfile,
}: ProfileEmptyStateProps) {
  // Different empty states for different tabs
  const emptyStates = {
    posts: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi foto' : 'Nessuna foto ancora',
      message: isOwnProfile
        ? 'Quando condividi le foto, saranno visualizzate sul tuo profilo.'
        : 'Quando questa persona condividerà foto, le vedrai qui.',
      action: isOwnProfile ? (
        <button className="text-[#0095f6] font-semibold text-sm hover:opacity-70 transition-opacity">
          Condividi la tua prima foto
        </button>
      ) : null,
    },
    reels: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi reel' : 'Nessun reel ancora',
      message: isOwnProfile
        ? 'Quando condividi i reel, saranno visualizzati sul tuo profilo.'
        : 'Quando questa persona condividerà reel, li vedrai qui.',
      action: null,
    },
    saved: {
      icon: <Bookmark className="w-16 h-16 stroke-[1px]" />,
      title: 'Salva',
      message:
        'Salva le foto e i video che desideri rivedere. Nessuno riceverà una notifica e solo tu potrai vedere cosa hai salvato.',
      action: null,
    },
    tagged: {
      icon: <TaggedEmptyIcon />,
      title: 'Foto in cui ci sei tu',
      message: isOwnProfile
        ? 'Quando le persone ti taggano nelle foto, saranno visualizzate qui.'
        : 'Quando questa persona viene taggata nelle foto, le vedrai qui.',
      action: null,
    },
  };

  const state = emptyStates[tab];

  if (!state) {
    return null;
  }

  return (
    <div className="py-16 flex flex-col items-center justify-center text-center mx-auto max-w-[350px]">
      {/* Icon */}
      <div className="mb-6 flex items-center justify-center">
        {state.icon}
      </div>

      {/* Title */}
      <h1 className="text-[30px] font-extrabold leading-9 text-center break-words text-[#0C1014] dark:text-[#F5F5F5] mb-4">
        {state.title}
      </h1>

      {/* Message */}
      <span className="text-sm font-normal leading-[18px] text-center break-words text-[#0C1014] dark:text-[#F5F5F5] w-[350px] mb-4 block">
        {state.message}
      </span>

      {/* Optional Action */}
      {state.action}
    </div>
  );
}
