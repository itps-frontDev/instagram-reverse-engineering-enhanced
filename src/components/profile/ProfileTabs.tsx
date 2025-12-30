/**
 * @fileoverview Profile tabs navigation
 */


'use client';
import React from 'react';

import { Grid3x3, Film, UserSquare2, Bookmark } from 'lucide-react';
import { ProfileTabsProps, ProfileTab } from '@/lib/types/profile';

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  showTagged,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTab; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'posts',
      icon: (active) => (
        <Grid3x3
          className={`w-6 h-6 ${
            active
              ? 'text-[#262626] dark:text-[#F5F5F5]'
              : 'text-[#8E8E8E]'
          }`}
          strokeWidth={active ? 2.5 : 2}
        />
      ),
    },
  ];

  if (showTagged) {
    tabs.push(
      {
        id: 'saved',
        icon: (active) => (
          <Bookmark
            className={`w-6 h-6 ${
              active
                ? 'text-[#262626] dark:text-[#F5F5F5]'
                : 'text-[#8E8E8E]'
            }`}
            strokeWidth={active ? 2.5 : 2}
          />
        ),
      },
      {
        id: 'tagged',
        icon: (active) => (
          <UserSquare2
            className={`w-6 h-6 ${
              active
                ? 'text-[#262626] dark:text-[#F5F5F5]'
                : 'text-[#8E8E8E]'
            }`}
            strokeWidth={active ? 2.5 : 2}
          />
        ),
      }
    );
  }

  return (
    <div className="relative">
      {/* Tabs - Icons Above Line */}
      <div className="flex justify-center items-center h-11 border-b border-[#dbdfe4] dark:border-[#2b3036]">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative transition-colors flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent flex-1 h-11 max-w-[193px]"
            >
              {tab.icon(isActive)}
              {/* Active indicator - positioned at bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#262626] dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
