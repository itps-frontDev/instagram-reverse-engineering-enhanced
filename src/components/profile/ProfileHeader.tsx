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
import { BadgeCheck, Camera } from 'lucide-react';
import ProfileStats from './ProfileStats';
import ProfileActions from './ProfileActions';
import ProfileBio from './ProfileBio';
import NewHighlight from './NewHighlight';
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
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center">
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
                <div
                  className="w-full h-full rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(85,85,85,0.7)',
                    color: '#f5f5f5',
                    fontFamily: 'apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '14px',
                  }}
                >
                  <Camera className="w-10 h-10 md:w-16 md:h-16" strokeWidth={1.5} style={{color: '#f5f5f5'}} />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            {/* Username + Badge Row */}
            <div className="flex items-center gap-1.5 mb-5">
              <h1
                className="block font-bold text-[24px] leading-[30px] h-[30px] max-w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer text-[rgb(12,16,20)] dark:text-[rgb(245,245,245)]"
                style={{
                  fontFamily: 'apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif',
                  fontWeight: 700,
                  direction: 'ltr',
                  listStyleType: 'none',
                  overflowWrap: 'break-word',
                  textAlign: 'start',
                  textOverflow: 'ellipsis',
                  width: '163.312px',
                  wordBreak: 'break-word',
                  WebkitTapHighlightColor: 'rgba(0,0,0,0)',
                  MozTextSizeAdjust: '100%',
                  WebkitTextSizeAdjust: '100%',
                  whiteSpace: 'nowrap',
                }}
                tabIndex={0}
              >
                {profile.username}
              </h1>
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
              {profile.is_verified && (
                <BadgeCheck className="w-[18px] h-[18px] text-[#0095f6] fill-[#0095f6] flex-shrink-0" />
              )}
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
