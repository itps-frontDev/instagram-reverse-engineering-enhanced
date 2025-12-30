/**
 * @fileoverview Profile statistics component
 *
 * Displays posts, followers, and following counts in Instagram's exact style.
 * Formats large numbers with K/M suffixes (1.2K, 1.5M).
 *
 * @module components/profile/ProfileStats
 */

'use client';

import { ProfileStatsProps } from '@/lib/types/profile';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format large numbers with K/M suffixes like Instagram.
 *
 * @param num - The number to format
 * @returns Formatted string (e.g., "1.2K", "1.5M", "42")
 *
 * @example
 * formatCount(42) // "42"
 * formatCount(1234) // "1.2K"
 * formatCount(1234567) // "1.2M"
 */
function formatCount(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ProfileStats Component
 *
 * Displays profile statistics in Instagram's exact format:
 * - Posts count (left)
 * - Followers count (center)
 * - Following count (right)
 *
 * **Visual Specs:**
 * - Font: 14px for all text
 * - Numbers: font-weight 600 (semibold)
 * - Labels: font-weight 400 (regular)
 * - Gap: 40px between stats on desktop
 * - Mobile: Centered with equal spacing
 *
 * @example
 * <ProfileStats
 *   postsCount={42}
 *   followersCount={1234}
 *   followingCount={567}
 * />
 */
export default function ProfileStats({
  postsCount,
  followersCount,
  followingCount,
}: ProfileStatsProps) {
  const statStyle = {
    fontFamily: 'apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '14px',
    fontWeight: 400,
    height: '18px',
    lineHeight: '18px',
    listStyleType: 'none',
    marginBottom: 0,
    marginInlineEnd: 0,
    marginInlineStart: 0,
    marginTop: 0,
    maxWidth: '100%',
    minWidth: 0,
    overflowWrap: 'break-word',
    overflowX: 'visible',
    overflowY: 'visible',
    position: 'relative',
    textAlign: 'start',
    wordBreak: 'break-word',
    WebkitTapHighlightColor: 'rgba(0,0,0,0)',
    MozTextSizeAdjust: '100%',
    WebkitTextSizeAdjust: '100%',
    whiteSpace: 'nowrap',
    unicodeBidi: 'isolate',
    cursor: 'pointer',
    direction: 'ltr',
  };
  return (
    <ul className="flex items-center gap-8 mb-5">
      {/* Posts */}
      <li
        style={statStyle}
        className="text-black dark:text-[rgb(245,245,245)]"
      >
        <span style={{ fontWeight: 600 }}>{formatCount(postsCount)}</span> post
      </li>
      {/* Followers */}
      <li
        style={statStyle}
        className="text-black dark:text-[rgb(245,245,245)]"
      >
        <span style={{ fontWeight: 600 }}>{formatCount(followersCount)}</span> follower
      </li>
      {/* Following */}
      <li
        style={statStyle}
        className="text-black dark:text-[rgb(245,245,245)]"
      >
        <span style={{ fontWeight: 600 }}>{formatCount(followingCount)}</span> seguiti
      </li>
    </ul>
  );
}
