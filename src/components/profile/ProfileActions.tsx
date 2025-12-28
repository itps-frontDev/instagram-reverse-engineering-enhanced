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
      <div className="flex items-center gap-2">
        <button
          className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors"
          onClick={() => (window.location.href = '/accounts/edit')}
        >
          Edit profile
        </button>
        <button
          className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
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
            Following
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
                  {actionLoading ? 'Unfollowing...' : 'Unfollow'}
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#363636]"
                  onClick={() => setShowDropdown(false)}
                >
                  Mute
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-[#363636]"
                  onClick={() => setShowDropdown(false)}
                >
                  Restrict
                </button>
              </div>
            </>
          )}
        </div>

        {/* Message Button */}
        <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
          Message
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
          {actionLoading ? 'Cancelling...' : 'Requested'}
        </button>
        <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
          Message
        </button>
      </div>
    );
  }

  // STATE 6: Not Following (Public or Private)
  return (
    <div className="flex items-center gap-2">
      <button
        className="px-4 h-8 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm transition-colors disabled:opacity-70"
        onClick={handleFollow}
        disabled={actionLoading || isLoading}
      >
        {actionLoading ? 'Following...' : 'Follow'}
      </button>
      <button className="px-4 h-8 rounded-lg bg-[#efefef] dark:bg-[#363636] hover:bg-[#dbdbdb] dark:hover:bg-[#262626] font-semibold text-sm transition-colors">
        Message
      </button>
    </div>
  );
}
