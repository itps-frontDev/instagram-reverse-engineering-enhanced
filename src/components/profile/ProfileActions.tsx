/**
 * @fileoverview Profile action buttons component
 *
 * Handles all profile states and displays appropriate buttons:
 * - Own profile: Edit profile, Settings
 * - Public/Following: Following (dropdown), Message
 * - Public/Not following: Follow, Message
 * - Private/Following: Following (dropdown), Message
 * - Private/Not following: Follow, Message (locked grid)
 * - Private/Pending: Requested, Message (locked grid)
 *
 * @module components/profile/ProfileActions
 */

'use client';

import { useState } from 'react';
import { Settings, ChevronDown } from 'lucide-react';
import { ProfileActionsProps } from '@/lib/types/profile';

/**
 * ProfileActions Component
 *
 * Renders action buttons based on profile relationship state.
 */
export default function ProfileActions({
  isOwnProfile,
  isFollowing,
  isPending,
  isPrivate,
  onFollow,
  onUnfollow,
  isLoading = false,
}: ProfileActionsProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await onFollow();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setActionLoading(true);
    setShowDropdown(false);
    try {
      await onUnfollow();
    } finally {
      setActionLoading(false);
    }
  };

  // STATE 1: Own Profile
  if (isOwnProfile) {
    return (
      <div className="flex items-center gap-4 w-full mt-4 mb-6">
        <button
          className="flex-1 h-[44px] px-5 rounded-[12px] bg-[rgb(240,242,245)] text-[rgb(12,16,20)] font-semibold text-[14px] flex items-center justify-center select-none border-none outline-none shadow-none transition-colors cursor-pointer dark:bg-[#25292e] dark:text-white"
          style={{
            fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            lineHeight: '18px',
            minWidth: 0,
            minHeight: 0,
            width: '329.125px',
            boxSizing: 'border-box',
            appearance: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            outlineColor: 'rgb(12,16,20)',
            textDecorationLine: 'none',
            textDecorationColor: 'rgb(12,16,20)',
            textDecorationStyle: 'solid',
            textDecorationThickness: 'auto',
            textOverflow: 'ellipsis',
            userSelect: 'none',
            touchAction: 'manipulation',
            marginBottom: 0,
            marginInlineEnd: 0,
            marginInlineStart: 0,
            marginTop: 0,
            borderRadius: '12px',
          }}
          onClick={() => (window.location.href = '/accounts/edit')}
        >
          Modifica profilo
        </button>
        <button
          className="flex-1 h-[44px] px-5 rounded-[12px] bg-[rgb(240,242,245)] text-[rgb(12,16,20)] font-semibold text-[14px] flex items-center justify-center select-none border-none outline-none shadow-none transition-colors cursor-pointer dark:bg-[#25292e] dark:text-white"
          style={{
            fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            lineHeight: '18px',
            minWidth: 0,
            minHeight: 0,
            width: '329.125px',
            boxSizing: 'border-box',
            appearance: 'none',
            WebkitTapHighlightColor: 'rgba(0,0,0,0)',
            outlineColor: 'rgb(12,16,20)',
            textDecorationLine: 'none',
            textDecorationColor: 'rgb(12,16,20)',
            textDecorationStyle: 'solid',
            textDecorationThickness: 'auto',
            textOverflow: 'ellipsis',
            userSelect: 'none',
            touchAction: 'manipulation',
            marginBottom: 0,
            marginInlineEnd: 0,
            marginInlineStart: 0,
            marginTop: 0,
            borderRadius: '12px',
          }}
        >
          Visualizza archivio
        </button>
      </div>
    );
  }

  // STATE 2-4: Following (Public or Private accepted)
  if (isFollowing && !isPending) {
    return (
      <div className="flex items-center gap-2">
        {/* Following Button with Dropdown */}
        <div className="relative">
          <button
            className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors flex items-center gap-1"
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={actionLoading}
          >
            Segui già
            <ChevronDown className="w-3 h-3" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />

              {/* Menu */}
              <div className="absolute top-full mt-2 bg-white dark:bg-[#262626] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 min-w-[200px] z-20">
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#363636] text-red-600 font-semibold"
                  onClick={handleUnfollow}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Annullamento...' : 'Non seguire più'}
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#363636]"
                  onClick={() => setShowDropdown(false)}
                >
                  Silenzia
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#363636]"
                  onClick={() => setShowDropdown(false)}
                >
                  Limita
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Button */}
        <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
          Messaggio
        </button>

        {/* Add Person Button */}
        <button className="w-8 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
        </button>
      </div>
    );
  }

  // STATE 5: Pending Request (Private profile)
  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors"
          onClick={handleUnfollow}
          disabled={actionLoading}
        >
          {actionLoading ? 'Annullamento...' : 'Richiesta effettuata'}
        </button>
        <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
          Messaggio
        </button>
      </div>
    );
  }

  // STATE 6: Not Following (Public or Private)
  return (
    <div className={`flex items-center gap-2 ${isPrivate ? 'w-full' : ''}`}>
      <button
        className={`h-8 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm transition-colors disabled:opacity-70 ${
          isPrivate ? 'flex-1 px-6' : 'px-4'
        }`}
        onClick={handleFollow}
        disabled={actionLoading || isLoading}
      >
        {actionLoading ? 'Caricamento...' : 'Segui'}
      </button>
      {!isPrivate && (
        <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
          Messaggio
        </button>
      )}
    </div>
  );
}
