/**
 * @fileoverview Homepage Loading State
 *
 * Skeleton loading UI for the main feed page.
 * Displayed during navigation and data fetching.
 */

import StoriesSkeleton from '@/components/common/skeletons/StoriesSkeleton';
import FeedPostSkeleton from '@/components/common/skeletons/FeedPostSkeleton';
import SuggestionsSkeleton from '@/components/common/skeletons/SuggestionsSkeleton';

export default function HomeLoading() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Main content container */}
      <div className="w-full max-w-[470px] flex flex-col items-center">
        {/* Stories skeleton */}
        <div className="w-full mb-6">
          <StoriesSkeleton />
        </div>

        {/* Feed posts skeleton */}
        <div className="w-full flex flex-col items-center space-y-3">
          <FeedPostSkeleton />
          <FeedPostSkeleton />
          <FeedPostSkeleton />
        </div>
      </div>

      {/* Suggestions sidebar skeleton */}
      <SuggestionsSkeleton />
    </div>
  );
}
