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
          strokeWidth={2}
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
            strokeWidth={2}
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
            strokeWidth={2}
          />
        ),
      }
    );
  }

  return (
    <div className="relative">
      {/* Tabs - Icons with bottom border */}
      <div className="flex justify-center items-center h-12 border-b border-[#dbdbdb] dark:border-[#262626] bg-transparent">
        {tabs.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={
                `relative flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent flex-1 h-12 max-w-[193px] px-6 transition-colors ` +
                (!isActive
                  ? 'hover:bg-[#f5f5f5] dark:hover:bg-[#181c20]'
                  : '')
              }
              style={{ marginLeft: idx !== 0 ? 16 : 0 }}
            >
              {tab.icon(isActive)}
              {/* Active indicator - positioned at bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-4 right-4 h-[2.5px] rounded bg-[#262626] dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
