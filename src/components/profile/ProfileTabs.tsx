/**
 * @fileoverview Profile tabs navigation
 */

'use client';

import { Grid3x3, Film, UserSquare2 } from 'lucide-react';
import { ProfileTabsProps, ProfileTab } from '@/lib/types/profile';

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  showTagged,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'posts', label: 'POSTS', icon: <Grid3x3 className="w-3 h-3" /> },
    { id: 'reels', label: 'REELS', icon: <Film className="w-3 h-3" /> },
  ];

  if (showTagged) {
    tabs.push({ id: 'tagged', label: 'TAGGED', icon: <UserSquare2 className="w-3 h-3" /> });
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto flex justify-center gap-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1.5 py-4 text-xs font-semibold tracking-wider transition-colors ${
              activeTab === tab.id
                ? 'text-black dark:text-white border-t border-black dark:border-white -mt-[1px]'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
