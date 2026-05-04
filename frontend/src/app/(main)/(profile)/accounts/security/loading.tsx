/**
 * @fileoverview Loading state per pagina sicurezza
 */

export default function Loading() {
  return (
    <div className="animate-pulse">
      {/* Titolo */}
      <div className="px-0 pt-0 pb-6">
        <div className="h-[25px] w-64 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      
      {/* Campi form */}
      <div className="space-y-6">
        <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl" />
        <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl" />
        <div className="h-12 bg-gray-100 dark:bg-[#232323] rounded-xl" />
      </div>
    </div>
  );
}
