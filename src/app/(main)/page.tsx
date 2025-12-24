/**
 * @fileoverview Homepage/Feed principale di Instagram.
 * 
 * Mostra il feed dei post degli utenti seguiti, le storie e i suggerimenti.
 */

import Stories from '@/components/feed/Stories';
import Post from '@/components/feed/Post';

export default function HomePage() {
  return (
    <>
      <div className="px-4 pt-8">
        {/* Stories Section */}
        <Stories />

        {/* Feed Posts */}
        <div className="space-y-4 mt-4">
          {/* TODO: Fetch posts from API */}
          <Post />
          <Post />
          <Post />
        </div>
      </div>

      {/* Sidebar con suggerimenti (desktop XL only) */}
      <aside className="hidden xl:block fixed right-8 top-24 w-80">
        <div className="space-y-4">
          {/* Current User Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div>
                <p className="font-semibold text-sm dark:text-white">username</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Nome Completo</p>
              </div>
            </div>
            <button className="text-xs font-semibold text-blue-500">
              Cambia
            </button>
          </div>

          {/* Suggestions */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                Suggerimenti per te
              </p>
              <button className="text-xs font-semibold dark:text-white">Mostra tutti</button>
            </div>
            
            {/* Suggested Users */}
            <div className="space-y-3">
              {Array(5).fill(null).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700" />
                    <div>
                      <p className="font-semibold text-sm dark:text-white">user_{i + 1}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Seguito da user</p>
                    </div>
                  </div>
                  <button className="text-xs font-semibold text-blue-500">
                    Segui
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-xs space-y-4" style={{ color: '#a8a8a8' }}>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              <a href="#" className="hover:underline">Informazioni</a>
              <span>·</span>
              <a href="#" className="hover:underline">Aiuto</a>
              <span>·</span>
              <a href="#" className="hover:underline">Stampa</a>
              <span>·</span>
              <a href="#" className="hover:underline">API</a>
              <span>·</span>
              <a href="#" className="hover:underline">Lavora con noi</a>
              <span>·</span>
              <a href="#" className="hover:underline">Privacy</a>
              <span>·</span>
              <a href="#" className="hover:underline">Condizioni</a>
              <span>·</span>
              <a href="#" className="hover:underline">Luoghi</a>
              <span>·</span>
              <a href="#" className="hover:underline">Lingua</a>
              <span>·</span>
              <a href="#" className="hover:underline">Meta Verified</a>
            </div>
            
            <p className="text-xs">© 2025 INSTAGRAM FROM META</p>
          </div>
        </div>
      </aside>
    </>
  );
}
