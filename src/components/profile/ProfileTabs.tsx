/**
 * @fileoverview Profile tabs navigation
 */

'use client';
import React from 'react';
import { ProfileTabsProps, ProfileTab } from '@/types/profile';
import PostsTabIcon from './icons/PostsTabIcon';
import SavedTabIcon from './icons/SavedTabIcon';
import TaggedTabIcon from './icons/TaggedTabIcon';
import ReelsTabIcon from './icons/ReelsTabIcon';

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  showTagged,
  hasReels = false,
  canViewTagged = false,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTab; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'posts',
      icon: (active) => <PostsTabIcon active={active} />,
    },
  ];

  // Add Reels tab if profile has reels
  if (hasReels) {
    tabs.push({
      id: 'reels',
      icon: (active) => <ReelsTabIcon active={active} />,
    });
  }

  // Add Saved tab only for own profile
  if (showTagged) {
    tabs.push({
      id: 'saved',
      icon: (active) => <SavedTabIcon active={active} />,
    });
  }

  // Add Tagged tab if can view (public/following) or own profile
  if (canViewTagged || showTagged) {
    tabs.push({
      id: 'tagged',
      icon: (active) => <TaggedTabIcon active={active} />,
    });
  }

  return (
    <div className="w-full flex justify-center gap-1 border-b border-[#DBDBDB] dark:border-[#2b3036]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent h-11 flex-1"
            style={{ flexBasis: 0, maxWidth: '193px', width: '193px' }}
          >
            <span className="flex items-center justify-center h-11 w-11">
              {tab.icon(isActive)}
            </span>
            {isActive && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-[2px] bg-[#262626] dark:bg-white" />
            )}
          </button>
        );
      })}
    </div>
  );
}
