/**
 * @fileoverview Suggestions Skeleton Loader
 *
 * Skeleton placeholder for Suggestions sidebar component during loading state.
 * Follows Next.js streaming best practices.
 */

export default function SuggestionsSkeleton() {
  return (
    <aside className="hidden 2xl:block fixed left-1/2 ml-[calc(710px/2+20px)] top-24 w-80">
      <div className="space-y-4 animate-pulse">
        {/* Current User Info Skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Suggestions Header */}
        <div className="mt-6 flex items-center justify-between">
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>

        {/* Suggested Users */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-2 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
              <div className="h-3 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
