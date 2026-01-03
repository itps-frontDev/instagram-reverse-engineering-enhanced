/**
 * @fileoverview Profile empty state component
 *
 * Displays appropriate empty state message based on the current tab.
 */

'use client';

import { Camera, Bookmark, UserSquare2 } from 'lucide-react';
import { ProfileTab } from '@/lib/types/profile';

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
      icon: <Camera className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" />,
      title: isOwnProfile ? 'Condividi foto' : 'Nessuna foto ancora',
      message: isOwnProfile
        ? 'Quando condividi le foto, saranno visualizzate sul tuo profilo.'
        : 'Quando questa persona condividerà foto, le vedrai qui.',
      action: isOwnProfile ? (
        <button className="text-[#0095f6] font-semibold text-sm hover:text-[#00376b] transition-colors">
          Condividi la tua prima foto
        </button>
      ) : null,
    },
    reels: {
      icon: <Camera className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" />,
      title: isOwnProfile ? 'Condividi reel' : 'Nessun reel ancora',
      message: isOwnProfile
        ? 'Quando condividi i reel, saranno visualizzati sul tuo profilo.'
        : 'Quando questa persona condividerà reel, li vedrai qui.',
      action: null,
    },
    saved: {
      icon: <Bookmark className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" />,
      title: 'Salva',
      message:
        'Salva le foto e i video che desideri rivedere. Nessuno riceverà una notifica e solo tu potrai vedere cosa hai salvato.',
      action: null,
    },
    tagged: {
      icon: <UserSquare2 className="w-16 h-16 md:w-24 md:h-24 stroke-[1px]" />,
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
    <div className="py-16 flex flex-col items-center justify-center text-center max-w-md mx-auto">
      {/* Icon Circle */}
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-black dark:border-white flex items-center justify-center mb-6">
        {state.icon}
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-light mb-4">{state.title}</h2>

      {/* Message */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm">
        {state.message}
      </p>

      {/* Optional Action */}
      {state.action}
    </div>
  );
}
