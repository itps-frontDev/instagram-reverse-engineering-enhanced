/**
 * @fileoverview Pagina Reels.
 * 
 * Feed verticale di video brevi.
 */

export default function ReelsPage() {
  return (
    <div className="max-w-md mx-auto px-4 pt-8">
      <h1 className="text-2xl font-semibold mb-6">Reels</h1>
      
      <div className="space-y-4">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="w-full aspect-[9/16] bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
