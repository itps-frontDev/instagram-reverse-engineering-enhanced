/**
 * @fileoverview Loading state per pagina privacy
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Titolo */}
      <div className="px-0 pt-0 pb-6">
        <div className="h-[25px] w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Toggle privacy */}
      <div className="bg-gray-100 dark:bg-[#232323] rounded-2xl px-4 py-3 mb-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
      </div>

      {/* Descrizione */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
