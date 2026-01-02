/**
 * @fileoverview Profile header component
 *
 * Main header that orchestrates all profile sub-components:
 * - Profile picture
 * - ProfileStats
 * - ProfileActions
 * - ProfileBio
 *
 * @module components/profile/ProfileHeader
 */

'use client';

import Image from 'next/image';
import ProfileStats from './ProfileStats';
import ProfileActions from './ProfileActions';
import ProfileBio from './ProfileBio';
import NewHighlight from './NewHighlight';
import VerifiedBadge from '@/components/common/VerifiedBadge';
import { ProfileHeaderProps } from '@/lib/types/profile';

/**
 * ProfileHeader Component
 *
 * Renders the complete profile header in Instagram's exact layout.
 */
export default function ProfileHeader({
  profile,
  followStatus,
  onFollow,
  onUnfollow,
  isLoading = false,
}: ProfileHeaderProps) {
  return (
    <header className="px-4 py-4 md:py-6">
      <div className="max-w-[693px] mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-7 items-center">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start flex-shrink-0">
            <div className="relative w-[77px] h-[77px] md:w-[150px] md:h-[150px]">
              <Image
                src={profile.profile_image_url || '/images/default-pfp.jpg'}
                alt={profile.username}
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 77px, 150px"
                priority
              />
              {/* Camera Icon Overlay - solo se non c'è immagine custom */}
              {!profile.profile_image_url && (
                <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none" style={{ backgroundColor: 'rgba(85, 85, 85, 0.7)' }}>
                  <svg
                    viewBox="0 0 24 24"
                    width="44"
                    height="44"
                    fill="currentColor"
                    className="text-[rgb(245,245,245)]"
                  >
                    <path d="M12 9.652a3.54 3.54 0 1 0 3.54 3.539A3.543 3.543 0 0 0 12 9.65zm6.59-5.187h-.52a1.107 1.107 0 0 1-1.032-.762 3.103 3.103 0 0 0-3.127-1.961H10.09a3.103 3.103 0 0 0-3.127 1.96 1.107 1.107 0 0 1-1.032.763h-.52A4.414 4.414 0 0 0 1 8.874v9.092a4.413 4.413 0 0 0 4.408 4.408h13.184A4.413 4.413 0 0 0 23 17.966V8.874a4.414 4.414 0 0 0-4.41-4.41zM12 18.73a5.54 5.54 0 1 1 5.54-5.54A5.545 5.545 0 0 1 12 18.73z"></path>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username + Badge Row */}
            <div className="flex items-center gap-1.5 mb-5">
              <h1
                className="text-2xl font-bold leading-[30px] h-[30px] truncate cursor-pointer text-instagram-primary"
                tabIndex={0}
              >
                {profile.username}
              </h1>

              {/* Verified Badge */}
              {profile.is_verified && (
                <VerifiedBadge size={18} />
              )}
              {/* Rotellina Opzioni */}
              <svg
                aria-label="Opzioni"
                className="ml-2 w-6 h-6 text-[rgb(12,16,20)] dark:text-[rgb(245,245,245)] cursor-pointer"
                fill="currentColor"
                height="24"
                role="img"
                viewBox="0 0 24 24"
                width="24"
              >
                <title>Opzioni</title>
                <circle cx="12" cy="12" fill="none" r="8.635" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></circle>
                <path d="M14.232 3.656a1.269 1.269 0 0 1-.796-.66L12.93 2h-1.86l-.505.996a1.269 1.269 0 0 1-.796.66m-.001 16.688a1.269 1.269 0 0 1 .796.66l.505.996h1.862l.505-.996a1.269 1.269 0 0 1 .796-.66M3.656 9.768a1.269 1.269 0 0 1-.66.796L2 11.07v1.862l.996.505a1.269 1.269 0 0 1 .66.796m16.688-.001a1.269 1.269 0 0 1 .660-.796L22 12.93v-1.86l-.996-.505a1.269 1.269 0 0 1-.66-.796M7.678 4.522a1.269 1.269 0 0 1-1.03.096l-1.06-.348L4.27 5.587l.348 1.062a1.269 1.269 0 0 1-.096 1.03m11.8 11.799a1.269 1.269 0 0 1 1.03-.096l1.06.348 1.318-1.317-.348-1.062a1.269 1.269 0 0 1 .096-1.03m-14.956.001a1.269 1.269 0 0 1 .096 1.03l-.348 1.06 1.317 1.318 1.062-.348a1.269 1.269 0 0 1 1.03.096m11.799-11.8a1.269 1.269 0 0 1-.096-1.03l.348-1.06-1.317-1.318-1.062.348a1.269 1.269 0 0 1-1.03-.096" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>

            {/* Stats - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:block">
              <ProfileStats
                postsCount={profile.posts_count}
                followersCount={profile.followers_count}
                followingCount={profile.following_count}
              />
            </div>

            {/* Bio */}
            <ProfileBio
              fullName={profile.full_name}
              bio={profile.bio}
              websiteUrl={profile.website_url}
            />
          </div>
        </div>

        {/* Action Buttons - Full Width Below */}
        <div className="mt-5">
          <ProfileActions
            isOwnProfile={followStatus.isOwnProfile}
            isFollowing={followStatus.isFollowing}
            isPending={followStatus.isPending}
            isPrivate={profile.is_private}
            onFollow={onFollow}
            onUnfollow={onUnfollow}
            isLoading={isLoading}
          />
        </div>

        {/* Story Highlights - Only on Own Profile */}
        {followStatus.isOwnProfile && (
          <div className="mt-8 flex gap-4 overflow-x-auto scrollbar-hide">
            <NewHighlight />
          </div>
        )}

        {/* Stats - Visible on mobile only */}
        <div className="md:hidden mt-6 pt-3 border-t border-gray-200 dark:border-gray-800">
          <ProfileStats
            postsCount={profile.posts_count}
            followersCount={profile.followers_count}
            followingCount={profile.following_count}
          />
        </div>
      </div>
    </header>
  );
}
