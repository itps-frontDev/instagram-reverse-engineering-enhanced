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
    <header className="px-4 py-8 md:py-12 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12">
          {/* Profile Picture */}
          <div className="flex justify-center md:justify-start flex-shrink-0">
            <div className="relative w-[77px] h-[77px] md:w-[150px] md:h-[150px]">
              {profile.profile_image_url ? (
                <Image
                  src={profile.profile_image_url}
                  alt={profile.username}
                  fill
                  className="rounded-full object-cover"
                  sizes="(max-width: 768px) 77px, 150px"
                  priority
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username + Actions Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-5 mb-5">
              <h1 className="text-xl font-normal truncate">{profile.username}</h1>
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
              isVerified={profile.is_verified}
            />
          </div>
        </div>

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
