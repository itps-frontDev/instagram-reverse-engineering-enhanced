/**
 * @fileoverview Pagina Notifiche.
 * 
 * Lista delle notifiche (like, commenti, follow, ecc.).
 */

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8">
      <h1 className="text-2xl font-semibold mb-6">Notifiche</h1>
      
      <div className="space-y-4">
        {Array(8).fill(null).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gray-200" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">username{i}</span> ha iniziato a seguirti.{' '}
                <span className="text-gray-500">2h</span>
              </p>
            </div>
            <button className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold">
              Segui
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
