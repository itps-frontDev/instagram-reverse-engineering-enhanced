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
import { useRouter } from 'next/navigation';
import { Settings, ChevronDown } from 'lucide-react';
import { ProfileActionsProps } from '@/lib/types/profile';
import UnfollowModal from './UnfollowModal';

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
  isFollowedBy,
  onFollow,
  onUnfollow,
  isLoading = false,
  profileId,
  username,
  profileImage,
}: ProfileActionsProps & { profileId?: number; username?: string; profileImage?: string }) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const handleFollow = async () => {
    setActionLoading(true);
    try {
      await onFollow();
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollowClick = () => {
    setShowUnfollowModal(true);
  };

  const handleUnfollowConfirm = async () => {
    setActionLoading(true);
    try {
      await onUnfollow();
      setShowUnfollowModal(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = () => {
    if (username) {
      // Naviga alla pagina direct con il profilo selezionato (usa username)
      router.push(`/direct?username=${username}`);
    }
  };

  // STATE 1: Own Profile
  if (isOwnProfile) {
    return (
      <div className="flex items-center gap-2 md:gap-4 w-full mt-2 md:mt-4 mb-3 md:mb-6">
        <button
          className="btn-instagram-secondary flex-1 !h-8 md:!h-10.5 text-sm"
          onClick={() => router.push('/accounts/edit')}
        >
          Modifica profilo
        </button>
        <button className="btn-instagram-secondary flex-1 !h-8 md:!h-10.5 text-sm">
          Visualizza archivio
        </button>
      </div>
    );
  }

  // STATE 2-4: Following (Public or Private accepted)
  if (isFollowing && !isPending) {
    return (
      <>
        <div className="flex items-center gap-2 md:gap-4 w-full mt-2 md:mt-4 mb-3 md:mb-6">
          {/* Following Button - Opens Unfollow Modal */}
          <button
            className="btn-instagram-secondary flex-1 !h-8 md:!h-10.5 w-full flex items-center justify-center gap-1 text-sm"
            onClick={handleUnfollowClick}
            disabled={actionLoading}
          >
            <span>Segui già</span>
            <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />
          </button>

          {/* Message Button */}
          <button 
            className="btn-instagram-secondary flex-1 !h-8 md:!h-10.5 text-sm"
            onClick={handleMessage}
          >
            Messaggio
          </button>

          {/* Add Person Button */}
          <button className="btn-instagram-secondary !h-8 !w-8  flex items-center justify-center">
            <svg aria-label="Account simili" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
              <title>Account simili</title>
              <path d="M19.006 8.252a3.5 3.5 0 1 1-3.499-3.5 3.5 3.5 0 0 1 3.5 3.5Z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></path>
              <path d="M22 19.5v-.447a4.05 4.05 0 0 0-4.05-4.049h-4.906a4.05 4.05 0 0 0-4.049 4.049v.447" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" x1="5.001" x2="5.001" y1="7.998" y2="14.003"></line>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" x1="8.004" x2="2.003" y1="11" y2="11"></line>
            </svg>
          </button>
        </div>
        
        {/* Unfollow Confirmation Modal */}
        <UnfollowModal
          isOpen={showUnfollowModal}
          onClose={() => setShowUnfollowModal(false)}
          onConfirm={handleUnfollowConfirm}
          isUnfollowing={actionLoading}
          username={username || ''}
          profileImage={profileImage}
        />
      </>
    );
  }

  // STATE 5: Pending Request (Private profile)
  if (isPending) {
    return (
      <>
        <div className="flex items-center gap-2 md:gap-4 w-full mt-2 md:mt-4 mb-3 md:mb-6">
          <button
            className="btn-instagram-pending flex-1 !h-8 md:!h-10.5 text-sm"
            onClick={handleUnfollowClick}
            disabled={actionLoading}
          >
            Richiesta effettuata
          </button>
        </div>
        
        {/* Unfollow Confirmation Modal */}
        <UnfollowModal
          isOpen={showUnfollowModal}
          onClose={() => setShowUnfollowModal(false)}
          onConfirm={handleUnfollowConfirm}
          isUnfollowing={actionLoading}
          username={username || ''}
          profileImage={profileImage}
        />
      </>
    );
  }

  // STATE 6: Not Following (Public or Private)
  return (
    <div className="flex items-center gap-2 md:gap-4 w-full mt-2 md:mt-4 mb-3 md:mb-6">
      <button
        className="btn-instagram-primary flex-1 !h-8 md:!h-10.5 text-sm"
        onClick={handleFollow}
        disabled={actionLoading || isLoading}
      >
        {actionLoading ? 'Caricamento...' : (isFollowedBy ? 'Segui anche tu' : 'Segui')}
      </button>
      {!isPrivate && (
        <>
          <button 
            className="btn-instagram-secondary flex-1 !h-8 md:!h-10.5 text-sm"
            onClick={handleMessage}
          >
            Messaggio
          </button>
          <button className="btn-instagram-secondary !h-8 md:!h-10.5 !w-8 md:!w-10.5 !p-3  flex items-center justify-center">
            <svg aria-label="Account simili" fill="currentColor" height="20" role="img" viewBox="0 0 24 24" width="20">
              <title>Account simili</title>
              <path d="M19.006 8.252a3.5 3.5 0 1 1-3.499-3.5 3.5 3.5 0 0 1 3.5 3.5Z" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></path>
              <path d="M22 19.5v-.447a4.05 4.05 0 0 0-4.05-4.049h-4.906a4.05 4.05 0 0 0-4.049 4.049v.447" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" x1="5.001" x2="5.001" y1="7.998" y2="14.003"></line>
              <line fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" x1="8.004" x2="2.003" y1="11" y2="11"></line>
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
