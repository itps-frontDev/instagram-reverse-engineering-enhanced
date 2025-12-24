/**
 * @fileoverview Pagina Profilo Utente.
 * 
 * Mostra info profilo, statistiche e grid dei post.
 */

import { Settings, Grid, Bookmark, UserSquare2 } from 'lucide-react';

export default function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  return (
    <div className="max-w-4xl mx-auto px-4 pt-8">
      {/* Profile Header */}
      <div className="flex items-start gap-8 mb-12">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
        
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-6">
            <h1 className="text-2xl font-light">username</h1>
            <button className="px-6 py-1.5 bg-gray-200 rounded-lg font-semibold text-sm">
              Modifica profilo
            </button>
            <Settings className="w-6 h-6 cursor-pointer" />
          </div>
          
          <div className="flex gap-8 mb-6">
            <div><span className="font-semibold">42</span> post</div>
            <div><span className="font-semibold">1.234</span> follower</div>
            <div><span className="font-semibold">567</span> seguiti</div>
          </div>
          
          <div>
            <p className="font-semibold">Nome Completo</p>
            <p className="text-sm">Bio del profilo</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-16 border-t border-gray-200">
        <button className="flex items-center gap-2 py-4 border-t border-black -mt-[1px]">
          <Grid className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">Post</span>
        </button>
        <button className="flex items-center gap-2 py-4 text-gray-400">
          <Bookmark className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">Salvati</span>
        </button>
        <button className="flex items-center gap-2 py-4 text-gray-400">
          <UserSquare2 className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase">Tag</span>
        </button>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-1 mt-4">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 hover:opacity-80 transition cursor-pointer" />
        ))}
      </div>
    </div>
  );
}
