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
  return (
    <ul className="flex items-center gap-4 md:gap-10 mb-5">
      {/* Posts */}
      <li className="flex items-center gap-1">
        <span className="font-semibold text-sm">{formatCount(postsCount)}</span>
        <span className="text-sm hidden md:inline">posts</span>
        <span className="text-sm md:hidden">posts</span>
      </li>

      {/* Followers */}
      <li className="flex items-center gap-1">
        <button
          type="button"
          className="font-semibold text-sm hover:opacity-50 transition-opacity"
          aria-label="View followers"
        >
          {formatCount(followersCount)}
        </button>
        <span className="text-sm">followers</span>
      </li>

      {/* Following */}
      <li className="flex items-center gap-1">
        <button
          type="button"
          className="font-semibold text-sm hover:opacity-50 transition-opacity"
          aria-label="View following"
        >
          {formatCount(followingCount)}
        </button>
        <span className="text-sm">following</span>
      </li>
    </ul>
  );
}
