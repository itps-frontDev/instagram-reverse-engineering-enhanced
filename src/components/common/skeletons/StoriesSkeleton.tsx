/**
 * @fileoverview Stories Skeleton Loader
 *
 * Skeleton placeholder for Stories component during loading state.
 * Follows Next.js streaming best practices.
 */

export default function StoriesSkeleton() {
  return (
    <div className="bg-white dark:bg-[#0c1014] border border-[#dbdbdb] dark:border-[#262626] rounded-lg py-4 px-2">
      <div className="flex gap-4 justify-start w-full overflow-hidden animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            {/* Story circle */}
            <div className="w-[82px] h-[82px] rounded-full bg-gray-200 dark:bg-gray-700" />
            {/* Username */}
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
