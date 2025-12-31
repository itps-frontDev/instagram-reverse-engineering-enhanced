/**
 * @fileoverview Profile tabs navigation
 */

'use client';
import React from 'react';
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
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
        >
          <title>Post</title>
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M3 3H21V21H3z"></path>
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M9.01486 3 9.01486 21"></path>
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M14.98514 3 14.98514 21"></path>
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M21 9.01486 3 9.01486"></path>
          <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M21 14.98514 3 14.98514"></path>
        </svg>
      ),
    },
  ];

  if (showTagged) {
    tabs.push(
      {
        id: 'saved',
        icon: (active) => (
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
            className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
          >
            <title>Elementi salvati</title>
            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" d="M20 21 12 13.44 4 21 4 3 20 3 20 21z"></path>
          </svg>
        ),
      },
      {
        id: 'tagged',
        icon: (active) => (
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
            className={active ? 'text-[#262626] dark:text-[#F5F5F5]' : 'text-[#8E8E8E]'}
          >
            <title>Post in cui ti hanno taggato</title>
            <path d="M10.201 3.797 12 1.997l1.799 1.8a1.59 1.59 0 0 0 1.124.465h5.259A1.818 1.818 0 0 1 22 6.08v14.104a1.818 1.818 0 0 1-1.818 1.818H3.818A1.818 1.818 0 0 1 2 20.184V6.08a1.818 1.818 0 0 1 1.818-1.818h5.26a1.59 1.59 0 0 0 1.123-.465z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px"></path>
            <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px">
              <path d="M18.598 22.002V21.4a3.949 3.949 0 0 0-3.948-3.949H9.495A3.949 3.949 0 0 0 5.546 21.4v.603" fill="none"></path>
              <circle cx="12.07211" cy="11.07515" r="3.55556" fill="none"></circle>
            </g>
          </svg>
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
