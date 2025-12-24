/**
 * @fileoverview Pagina Esplora.
 * 
 * Grid di post popolari e suggerimenti.
 */

export default function ExplorePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-semibold mb-6">Esplora</h1>
      
      {/* Grid di post */}
      <div className="grid grid-cols-3 gap-1">
        {Array(12).fill(null).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 hover:opacity-80 transition cursor-pointer" />
        ))}
      </div>
    </div>
  );
}
