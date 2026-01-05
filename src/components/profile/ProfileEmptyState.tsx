/**
 * @fileoverview Profile empty state component
 *
 * Displays appropriate empty state message based on the current tab.
 */

'use client';

import { ProfileTab } from '@/lib/types/profile';
import PostsEmptyIcon from './icons/PostsEmptyIcon';
import TaggedEmptyIcon from './icons/TaggedEmptyIcon';
import SavedEmptyIcon from './icons/SavedEmptyIcon';

export interface ProfileEmptyStateProps {
  tab: ProfileTab;
  isOwnProfile: boolean;
  onCreatePost?: () => void;
}

export default function ProfileEmptyState({
  tab,
  isOwnProfile,
  onCreatePost,
}: ProfileEmptyStateProps) {
  // Different empty states for different tabs
  const emptyStates = {
    posts: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi foto' : 'Ancora nessun post',
      message: isOwnProfile
        ? 'Quando condividi le foto, saranno visualizzate sul tuo profilo.'
        : '',
      action: isOwnProfile ? (
        <button
          onClick={onCreatePost}
          className="text-[rgb(133,161,255)] font-semibold text-sm hover:underline transition-all"
        >
          Condividi la tua prima foto
        </button>
      ) : null,
    },
    reels: {
      icon: <PostsEmptyIcon />,
      title: isOwnProfile ? 'Condividi reel' : 'Nessun reel ancora',
      message: isOwnProfile
        ? 'Quando condividi i reel, saranno visualizzati sul tuo profilo.'
        : '',
      action: null,
    },
    saved: {
      icon: <SavedEmptyIcon />,
      title: 'Salva',
      message:
        'Salva le foto e i video che desideri rivedere. Nessuno riceverà una notifica e solo tu potrai vedere cosa hai salvato.',
      action: null,
    },
    tagged: {
      icon: <TaggedEmptyIcon />,
      title: isOwnProfile ? 'Foto in cui ci sei tu' : 'Nessuna foto',
      message: isOwnProfile
        ? 'Quando le persone ti taggano nelle foto, saranno visualizzate qui.'
        : '',
      action: null,
    },
  };

  const state = emptyStates[tab];

  if (!state) {
    return null;
  }

  // Special layout for saved tab
  if (tab === 'saved') {
    return (
      <div className="flex flex-col items-center w-full">
        {/* Saved Header */}
        <div className="w-full max-w-[938px] flex items-center justify-between my-8">
          <span className="text-xs leading-4 text-[rgb(168,168,168)]">
            Solo tu puoi vedere gli elementi che hai salvato
          </span>
          <button className="text-[rgb(133,161,255)] font-semibold text-sm hover:underline transition-all">
            + Nuova raccolta
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center text-center mx-auto max-w-[350px]">
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
        </div>
      </div>
    );
  }

  // Default layout for other tabs
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center mx-auto max-w-[350px]">
      {/* Icon */}
      <div
        className={`mb-6 flex items-center justify-center ${
          isOwnProfile && tab === 'posts' ? 'cursor-pointer' : ''
        }`}
        onClick={isOwnProfile && tab === 'posts' ? onCreatePost : undefined}
        role={isOwnProfile && tab === 'posts' ? 'button' : undefined}
        tabIndex={isOwnProfile && tab === 'posts' ? 0 : undefined}
      >
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
