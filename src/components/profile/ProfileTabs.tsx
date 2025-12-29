/**
 * @fileoverview Profile tabs navigation
 */

'use client';

import { Grid3x3, Film, UserSquare2, Bookmark } from 'lucide-react';
import { ProfileTabsProps, ProfileTab } from '@/lib/types/profile';

export default function ProfileTabs({
  activeTab,
  onTabChange,
  postsCount,
  showTagged,
}: ProfileTabsProps) {
  const tabs: { id: ProfileTab; icon: (active: boolean) => React.ReactNode }[] = [
    { id: 'posts', icon: (active) => <Grid3x3 className="w-6 h-6" style={{ color: active ? '#f5f5f5' : 'rgb(142,142,142)', stroke: active ? '#f5f5f5' : 'rgb(142,142,142)', fill: 'none', fontFamily: 'apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif' }} /> },
  ];

  if (showTagged) {
    tabs.push(
      { id: 'saved', icon: (active) => <Bookmark className="w-6 h-6" style={{ color: active ? '#f5f5f5' : 'rgb(142,142,142)', stroke: active ? '#f5f5f5' : 'rgb(142,142,142)', fill: 'none', fontFamily: 'apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif' }} /> },
      { id: 'tagged', icon: (active) => <UserSquare2 className="w-6 h-6" style={{ color: active ? '#f5f5f5' : 'rgb(142,142,142)', stroke: active ? '#f5f5f5' : 'rgb(142,142,142)', fill: 'none', fontFamily: 'apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif' }} /> }
    );
  }

  return (
    <div className="relative">
      {/* Tabs - Icons Above Line */}
      <div className="flex justify-center gap-16 md:gap-24 px-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative pb-3 pt-4 transition-colors flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent`}
              style={{ WebkitTapHighlightColor: 'rgba(0,0,0,0)' }}
            >
              {tab.icon(isActive)}
              {/* Active indicator - positioned at bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-black dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Separator Line rimossa per evitare doppie linee */}
    </div>
  );
}
