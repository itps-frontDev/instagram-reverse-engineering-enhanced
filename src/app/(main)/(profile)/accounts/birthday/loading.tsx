/**
 * @fileoverview Loading state per pagina compleanno
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Titolo */}
      <div className="px-0 pt-0 pb-6">
        <div className="h-[25px] w-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Label */}
      <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
      
      {/* 3 Dropdown skeleton */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1 h-[44px] bg-gray-100 dark:bg-[#262626] rounded-xl" />
        <div className="w-24 h-[44px] bg-gray-100 dark:bg-[#262626] rounded-xl" />
        <div className="w-28 h-[44px] bg-gray-100 dark:bg-[#262626] rounded-xl" />
      </div>
      
      {/* Testo descrizione */}
      <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      
      {/* Pulsante */}
      <div className="flex justify-end">
        <div className="w-[253px] h-11 bg-gray-200 dark:bg-gray-700 rounded-xl mt-4" />
      </div>
    </div>
  );
}
