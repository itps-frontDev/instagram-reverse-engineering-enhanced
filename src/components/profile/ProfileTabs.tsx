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
  const tabs: { id: ProfileTab; icon: (active: boolean, dark: boolean) => React.ReactNode }[] = [
    {
      id: 'posts',
      icon: (active, dark) => (
        <Grid3x3
          className="w-6 h-6"
          style={{
            color: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
            stroke: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
            fill: 'none',
            fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        />
      ),
    },
  ];

  if (showTagged) {
    tabs.push(
      {
        id: 'saved',
        icon: (active, dark) => (
          <Bookmark
            className="w-6 h-6"
            style={{
              color: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
              stroke: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
              fill: 'none',
              fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          />
        ),
      },
      {
        id: 'tagged',
        icon: (active, dark) => (
          <UserSquare2
            className="w-6 h-6"
            style={{
              color: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
              stroke: active ? (dark ? 'rgb(245,245,245)' : 'rgb(12,16,20)') : 'rgb(142,142,142)',
              fill: 'none',
              fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            }}
          />
        ),
      }
    );
  }

  // Detect dark mode using a media query
  const [isDark, setIsDark] = React.useState(false);
  React.useEffect(() => {
    const match = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener('change', handler);
    return () => match.removeEventListener('change', handler);
  }, []);

  return (
    <div className="relative">
      {/* Tabs - Icons Above Line */}
      <div
        className="flex justify-center items-center"
        style={{
          borderBottom: isDark
            ? '1px solid rgb(43,48,54)'
            : '1px solid rgb(219,223,228)',
          color: isDark ? 'rgb(245,245,245)' : 'rgb(12,16,20)',
          fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          fontSize: '14px',
          height: '44px',
          lineHeight: '18px',
          columnGap: '4px',
          direction: 'ltr',
          justifyContent: 'center',
          marginBottom: 0,
          marginInlineEnd: 0,
          marginInlineStart: 0,
          marginTop: 0,
          paddingBottom: 0,
          paddingInlineEnd: 0,
          paddingInlineStart: 0,
          paddingTop: 0,
          unicodeBidi: 'isolate',
          width: '1021.94px',
          textSizeAdjust: '100%',
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative transition-colors flex items-center justify-center cursor-pointer appearance-none outline-none border-none bg-transparent`}
              style={{
                alignItems: 'center',
                color: 'rgb(12,16,20)',
                direction: 'ltr',
                display: 'flex',
                flexBasis: '0px',
                flexGrow: 1,
                flexShrink: 1,
                fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                fontSize: '14px',
                height: '44px',
                justifyContent: 'center',
                lineHeight: '18px',
                marginBottom: 0,
                marginInlineEnd: 0,
                marginInlineStart: 0,
                marginTop: 0,
                maxWidth: '193px',
                width: '193px',
                paddingBottom: 0,
                paddingInlineEnd: 0,
                paddingInlineStart: 0,
                paddingTop: 0,
                textSizeAdjust: '100%',
                unicodeBidi: 'isolate',
                WebkitTapHighlightColor: 'rgba(0,0,0,0)',
              }}
            >
              {tab.icon(isActive, isDark)}
              {/* Active indicator - positioned at bottom */}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[rgb(12,16,20)] dark:bg-white" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
