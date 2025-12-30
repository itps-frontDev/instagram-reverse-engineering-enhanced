/**
 * @fileoverview Edit Profile Page Loading State
 *
 * Skeleton loading UI for the edit profile page.
 * Displayed during navigation and data fetching.
 */

export default function EditProfileLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-black animate-pulse">
      {/* Header Skeleton */}
      <header className="border-b border-gray-200 dark:border-gray-800 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Menu Skeleton */}
        <aside className="w-64 border-r border-gray-200 dark:border-gray-800 p-4">
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </aside>

        {/* Form Skeleton */}
        <main className="flex-1 p-8">
          <div className="max-w-2xl">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-6" />

            <div className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>

              {/* Form Fields */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              ))}

              {/* Submit Button */}
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
