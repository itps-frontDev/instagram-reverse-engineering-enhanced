/**
 * @fileoverview Loading state per pagina modifica profilo
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Titolo */}
      <div className="px-0 pt-0 pb-6">
        <div className="h-[25px] w-40 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>

      {/* Avatar + username */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Campi form */}
      <div className="space-y-6">
        {/* Website */}
        <div>
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl" />
        </div>
        
        {/* Bio */}
        <div>
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-24 bg-gray-100 dark:bg-[#232323] rounded-xl" />
        </div>
        
        {/* Genere */}
        <div>
          <div className="h-4 w-14 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
          <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl" />
        </div>
      </div>

      {/* Pulsante */}
      <div className="flex justify-end mt-6">
        <div className="w-[253px] h-11 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}
