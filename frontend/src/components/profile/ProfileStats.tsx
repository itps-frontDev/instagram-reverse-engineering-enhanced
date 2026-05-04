/**
 * @fileoverview Componente statistiche profilo.
 *
 * Mostra conteggi post, follower e following nello stile esatto di Instagram.
 * Formatta numeri grandi con suffissi K/M (1,2K, 1,5M).
 *
 * @module components/profile/ProfileStats
 */

'use client';

import { ProfileStatsProps } from '@/types/profile';

// ============================================================================
// FUNZIONI HELPER
// ============================================================================

/**
 * Formatta numeri grandi con suffissi K/M come Instagram.
 *
 * @param num - Il numero da formattare
 * @returns Stringa formattata (es. "1,2K", "1,5M", "42")
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
 * Componente statistiche profilo
 *
 * Mostra le statistiche del profilo nello stile esatto di Instagram:
 * - Conteggio post (sinistra)
 * - Conteggio follower (centro)
 * - Conteggio seguiti (destra)
 *
 * **Specifiche visive:**
 * - Font: 14px per tutto il testo
 * - Numeri: font-weight 600 (semibold)
 * - Etichette: font-weight 400 (regular)
 * - Spaziatura: 40px tra le statistiche su desktop
 * - Mobile: Centrate con spaziatura uguale
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
  onFollowersClick,
  onFollowingClick,
  canViewContent = true,
}: ProfileStatsProps) {

  // Gestori click follower/following
  const handleFollowersClick = () => {
    if (canViewContent && onFollowersClick) {
      onFollowersClick();
    }
  };

  // Gestore click seguiti
  const handleFollowingClick = () => {
    if (canViewContent && onFollowingClick) {
      onFollowingClick();
    }
  };

  return (
    <ul className="flex items-center justify-around md:justify-start md:gap-8 mb-3 md:mb-5">
      {/* Posts */}
      <li className="text-sm leading-[18px] whitespace-nowrap text-instagram-primary text-center md:text-left">
        <span className="font-semibold block md:inline">{formatCount(postsCount)}</span>
        <span className="block md:inline md:ml-1">post</span>
      </li>
      {/* Followers */}
      <li
        className="text-sm leading-[18px] whitespace-nowrap cursor-pointer text-instagram-primary active:scale-95 transition-transform text-center md:text-left"
        onClick={handleFollowersClick}
      >
        <span className="font-semibold block md:inline">{formatCount(followersCount)}</span>
        <span className="block md:inline md:ml-1">follower</span>
      </li>
      {/* Following */}
      <li
        className="text-sm leading-[18px] whitespace-nowrap cursor-pointer text-instagram-primary active:scale-95 transition-transform text-center md:text-left"
        onClick={handleFollowingClick}
      >
        <span className="font-semibold">{formatCount(followingCount)}</span> seguiti
      </li>
    </ul>
  );
}
