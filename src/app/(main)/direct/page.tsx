/**
 * @fileoverview Pagina Messaggi Diretti.
 * 
 * Lista delle conversazioni.
 */

export default function DirectPage() {
  return (
    <div className="max-w-4xl mx-auto border-l border-r border-gray-200 min-h-screen">
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold">Messaggi</h1>
      </div>
      
      {/* Lista chat */}
      <div>
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
            <div className="w-14 h-14 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="font-semibold">username{i}</p>
              <p className="text-sm text-gray-500">Ultimo messaggio...</p>
            </div>
            <span className="text-xs text-gray-400">2h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
