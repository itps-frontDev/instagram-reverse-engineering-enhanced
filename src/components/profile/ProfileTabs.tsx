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
    <div className="relative -mx-8">
      {/* Tabs - Icons with bottom border */}
      <div className="flex h- border-b-2 border-[#2b3036] bg-transparent px-99">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={
                `relative flex-1 flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent h-12 transition-colors ` +
                (!isActive ? 'hover:bg-[#f5f5f5] dark:hover:bg-[#181c20]' : '')
              }
              style={{ minWidth: 0 }}
            >
              <span className="flex items-center justify-center h-12 w-12">
                {tab.icon(isActive)}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[2px] rounded bg-[#262626] dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
