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
          className="btn-instagram-secondary flex-1"
          onClick={() => (window.location.href = '/accounts/edit')}
        >
          Modifica profilo
        </button>
        <button className="btn-instagram-secondary flex-1">
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
        <button className="btn-instagram-secondary px-4 h-8 text-sm">
          Messaggio
        </button>

        {/* Add Person Button */}
        <button className="w-8 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors flex items-center justify-center">
          <button className="btn-instagram-secondary w-8 h-8 flex items-center justify-center text-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </button>
      </div>
    );
  }

  // STATE 5: Pending Request (Private profile)
  if (isPending) {
    return (
      <div className="flex items-center gap-2">
        <button
          className="btn-instagram-secondary px-4 h-8 text-sm"
          onClick={handleUnfollow}
          disabled={actionLoading}
        >
          {actionLoading ? 'Annullamento...' : 'Richiesta effettuata'}
        </button>
        <button className="btn-instagram-secondary px-4 h-8 text-sm">
          Messaggio
        </button>
      </div>
    );
  }

  // STATE 6: Not Following (Public or Private)
  return (
    <div className={`flex items-center gap-2 ${isPrivate ? 'w-full' : ''}`}>
      <button
        className={`btn-instagram-primary h-8 text-sm ${isPrivate ? 'flex-1 px-6' : 'px-4'}`}
        onClick={handleFollow}
        disabled={actionLoading || isLoading}
      >
        {actionLoading ? 'Caricamento...' : 'Segui'}
      </button>
      {!isPrivate && (
        <button className="btn-instagram-secondary px-4 h-8 text-sm">
          Messaggio
        </button>
      )}
    </div>
  );
}
