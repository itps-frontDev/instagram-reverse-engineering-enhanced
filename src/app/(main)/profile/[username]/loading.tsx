/**
 * @fileoverview Profile Page Loading State
 *
 * Skeleton loading UI for user profile pages.
 * Displayed during navigation and data fetching.
 */

import ProfileHeaderSkeleton from '@/components/common/skeletons/ProfileHeaderSkeleton';
import ProfileGridSkeleton from '@/components/common/skeletons/ProfileGridSkeleton';

export default function ProfileLoading() {
  return (
    <div className="w-full flex flex-col items-center pb-12">
      <div className="w-full max-w-5xl mx-auto">
        {/* Profile Header Skeleton */}
        <ProfileHeaderSkeleton />

        {/* Tabs Skeleton */}
        <div className="w-full mt-8 border-t border-gray-200 dark:border-gray-800 pt-4">
          <div className="flex justify-center gap-16 animate-pulse">
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

        {/* Grid Skeleton */}
        <div className="w-full max-w-3xl mx-auto mt-6 px-4">
          <ProfileGridSkeleton />
        </div>
      </div>
    </div>
  );
}
