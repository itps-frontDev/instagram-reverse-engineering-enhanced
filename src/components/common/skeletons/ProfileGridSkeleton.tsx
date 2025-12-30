/**
 * @fileoverview Profile Grid Skeleton Loader
 *
 * Skeleton placeholder for ProfileGrid component during loading state.
 * Follows Next.js streaming best practices.
 */

export default function ProfileGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2 animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-200 dark:bg-gray-700 rounded"
        />
      ))}
    </div>
  );
}
