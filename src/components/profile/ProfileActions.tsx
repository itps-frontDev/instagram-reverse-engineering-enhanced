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
          className="btn-instagram-secondary flex-1 !h-10.5"
          onClick={() => (window.location.href = '/accounts/edit')}
        >
          Modifica profilo
        </button>
        <button className="btn-instagram-secondary flex-1 !h-10.5">
          Visualizza archivio
        </button>
      </div>
    );
  }

  // STATE 2-4: Following (Public or Private accepted)
  if (isFollowing && !isPending) {
    return (
      <div className="flex items-center gap-4 w-full mt-4 mb-6">
        {/* Following Button with Dropdown */}
        <div className="relative flex-1">
          <button
            className="btn-instagram-following !h-10.5 w-full"
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
        <button className="btn-instagram-secondary flex-1 !h-10.5">
          Messaggio
        </button>

        {/* Add Person Button */}
        <button className="btn-instagram-secondary !h-10.5 w-10.5 flex items-center justify-center">
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
      <div className="flex items-center gap-4 w-full mt-4 mb-6">
        <button
          className="btn-instagram-pending flex-1 !h-10.5"
          onClick={handleUnfollow}
          disabled={actionLoading}
        >
          {actionLoading ? 'Annullamento...' : 'Richiesta effettuata'}
        </button>
      </div>
    );
  }

  // STATE 6: Not Following (Public or Private)
  return (
    <div className="flex items-center gap-4 w-full mt-4 mb-6">
      <button
        className="btn-instagram-primary flex-1 !h-10.5"
        onClick={handleFollow}
        disabled={actionLoading || isLoading}
      >
        {actionLoading ? 'Caricamento...' : 'Segui'}
      </button>
      {!isPrivate && (
        <button className="btn-instagram-secondary flex-1 !h-10.5">
          Messaggio
        </button>
      )}
    </div>
  );
}
